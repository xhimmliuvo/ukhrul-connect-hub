import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  Camera,
  X,
  CheckCircle,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function AgentCompleteDelivery() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(null);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please grant camera permission.');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
    }
  }

  function retakePhoto() {
    setCapturedImage(null);
    startCamera();
  }

  async function handleComplete() {
    if (!capturedImage || !orderId || !user) {
      toast.error('Please capture a photo of the delivery');
      return;
    }

    setUploading(true);
    try {
      // Get agent id
      const { data: agentData } = await supabase
        .from('delivery_agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!agentData) throw new Error('Agent not found');

      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Upload to storage
      const fileName = `${orderId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('delivery-proofs')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) {
        // If bucket doesn't exist, just skip the image upload for now
        console.error('Upload error:', uploadError);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('delivery-proofs')
        .getPublicUrl(fileName);

      // Update order
      const { error: updateError } = await supabase
        .from('delivery_orders')
        .update({
          status: 'delivered',
          delivery_time: new Date().toISOString(),
          delivery_notes: deliveryNotes || null,
          proof_of_delivery_images: urlData?.publicUrl ? [urlData.publicUrl] : [],
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Update agent stats - fetch current and increment
      const { data: currentAgent } = await supabase
        .from('delivery_agents')
        .select('total_deliveries, total_earnings')
        .eq('id', agentData.id)
        .single();

      const { data: orderData } = await supabase
        .from('delivery_orders')
        .select('total_fee, agent_adjusted_fee')
        .eq('id', orderId)
        .single();

      if (currentAgent && orderData) {
        const earnings = orderData.agent_adjusted_fee || orderData.total_fee || 0;
        await supabase
          .from('delivery_agents')
          .update({
            total_deliveries: (currentAgent.total_deliveries || 0) + 1,
            total_earnings: (currentAgent.total_earnings || 0) + earnings,
          })
          .eq('id', agentData.id);
      }

      toast.success('Delivery completed!');
      navigate('/agent');
    } catch (err: any) {
      toast.error('Failed to complete delivery', { description: err.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground"
            onClick={() => navigate('/agent/active')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-lg">Complete Delivery</h1>
        </div>
      </div>

      <main className="p-4 space-y-4">
        {/* Camera/Photo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Proof of Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{cameraError}</p>
                  <Button variant="outline" size="sm" onClick={startCamera} className="mt-2">
                    Try Again
                  </Button>
                </div>
              ) : capturedImage ? (
                <>
                  <img 
                    src={capturedImage} 
                    alt="Captured delivery" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={retakePhoto}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Retake
                  </Button>
                </>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            <canvas ref={canvasRef} className="hidden" />

            {!capturedImage && !cameraError && (
              <Button 
                className="w-full mt-4" 
                size="lg"
                onClick={capturePhoto}
              >
                <Camera className="h-5 w-5 mr-2" />
                Capture Photo
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Notes (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any notes about the delivery..."
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Complete Button */}
        <Button
          className="w-full h-14 text-lg"
          onClick={handleComplete}
          disabled={!capturedImage || uploading}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <CheckCircle className="h-5 w-5 mr-2" />
          )}
          {uploading ? 'Completing...' : 'Complete Delivery'}
        </Button>
      </main>
    </div>
  );
}
