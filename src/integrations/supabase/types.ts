export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          active: boolean | null
          address: string | null
          business_type: string | null
          can_take_bookings: boolean | null
          category_id: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          email: string | null
          featured: boolean | null
          has_products: boolean | null
          id: string
          images: string[] | null
          location_lat: number | null
          location_lng: number | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          popularity_score: number | null
          rating: number | null
          review_count: number | null
          service_area_id: string | null
          short_description: string | null
          slug: string
          updated_at: string | null
          verified: boolean | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          business_type?: string | null
          can_take_bookings?: boolean | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          featured?: boolean | null
          has_products?: boolean | null
          id?: string
          images?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          popularity_score?: number | null
          rating?: number | null
          review_count?: number | null
          service_area_id?: string | null
          short_description?: string | null
          slug: string
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          business_type?: string | null
          can_take_bookings?: boolean | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          featured?: boolean | null
          has_products?: boolean | null
          id?: string
          images?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          popularity_score?: number | null
          rating?: number | null
          review_count?: number | null
          service_area_id?: string | null
          short_description?: string | null
          slug?: string
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          type: Database["public"]["Enums"]["category_type"]
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          type: Database["public"]["Enums"]["category_type"]
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          type?: Database["public"]["Enums"]["category_type"]
        }
        Relationships: []
      }
      dropee_orders: {
        Row: {
          business_id: string
          business_name: string
          business_type: string
          created_at: string | null
          details: Json
          id: string
          order_type: string
          status: string | null
          updated_at: string | null
          user_contact: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          business_name: string
          business_type: string
          created_at?: string | null
          details?: Json
          id?: string
          order_type: string
          status?: string | null
          updated_at?: string | null
          user_contact: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          business_name?: string
          business_type?: string
          created_at?: string | null
          details?: Json
          id?: string
          order_type?: string
          status?: string | null
          updated_at?: string | null
          user_contact?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dropee_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      dropee_services: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number
          icon: string
          id: string
          name: string
          price: string
          service_area_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          name: string
          price: string
          service_area_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          name?: string
          price?: string
          service_area_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropee_services_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          active: boolean | null
          address: string | null
          category_id: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          entry_fee: number | null
          event_date: string
          featured: boolean | null
          id: string
          images: string[] | null
          location_lat: number | null
          location_lng: number | null
          name: string
          organizer: string | null
          organizer_contact: string | null
          service_area_id: string | null
          short_description: string | null
          slug: string
          start_time: string | null
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          entry_fee?: number | null
          event_date: string
          featured?: boolean | null
          id?: string
          images?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          name: string
          organizer?: string | null
          organizer_contact?: string | null
          service_area_id?: string | null
          short_description?: string | null
          slug: string
          start_time?: string | null
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          entry_fee?: number | null
          event_date?: string
          featured?: boolean | null
          id?: string
          images?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          organizer?: string | null
          organizer_contact?: string | null
          service_area_id?: string | null
          short_description?: string | null
          slug?: string
          start_time?: string | null
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          active: boolean | null
          address: string | null
          best_time_to_visit: string | null
          category_id: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          entry_fee: number | null
          facilities: string[] | null
          featured: boolean | null
          id: string
          images: string[] | null
          location_lat: number | null
          location_lng: number | null
          name: string
          opening_hours: Json | null
          rating: number | null
          review_count: number | null
          service_area_id: string | null
          short_description: string | null
          slug: string
          tips: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          best_time_to_visit?: string | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          entry_fee?: number | null
          facilities?: string[] | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          name: string
          opening_hours?: Json | null
          rating?: number | null
          review_count?: number | null
          service_area_id?: string | null
          short_description?: string | null
          slug: string
          tips?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          best_time_to_visit?: string | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          entry_fee?: number | null
          facilities?: string[] | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          opening_hours?: Json | null
          rating?: number | null
          review_count?: number | null
          service_area_id?: string | null
          short_description?: string | null
          slug?: string
          tips?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_packages: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          name: string
          starting_price: number | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          name: string
          starting_price?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          starting_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "popular_packages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available: boolean | null
          business_id: string
          category: string | null
          created_at: string | null
          description: string | null
          discount_price: number | null
          id: string
          image: string | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          business_id: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_price?: number | null
          id?: string
          image?: string | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          business_id?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          discount_price?: number | null
          id?: string
          image?: string | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          last_visit_date: string | null
          phone: string | null
          points: number | null
          service_area_id: string | null
          updated_at: string | null
          visit_streak: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          last_visit_date?: string | null
          phone?: string | null
          points?: number | null
          service_area_id?: string | null
          updated_at?: string | null
          visit_streak?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          last_visit_date?: string | null
          phone?: string | null
          points?: number | null
          service_area_id?: string | null
          updated_at?: string | null
          visit_streak?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_banners: {
        Row: {
          banner_type: string
          created_at: string
          display_order: number
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_text: string | null
          link_url: string | null
          page_placement: string
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_type?: string
          created_at?: string
          display_order?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          page_placement?: string
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_type?: string
          created_at?: string
          display_order?: number
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          page_placement?: string
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          business_id: string | null
          comment: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          images: string[] | null
          place_id: string | null
          rating: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          place_id?: string | null
          rating: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          place_id?: string | null
          rating?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      service_areas: {
        Row: {
          active: boolean | null
          center_lat: number
          center_lng: number
          created_at: string | null
          id: string
          name: string
          radius_km: number
          slug: string
        }
        Insert: {
          active?: boolean | null
          center_lat: number
          center_lng: number
          created_at?: string | null
          id?: string
          name: string
          radius_km?: number
          slug: string
        }
        Update: {
          active?: boolean | null
          center_lat?: number
          center_lng?: number
          created_at?: string | null
          id?: string
          name?: string
          radius_km?: number
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "business_owner"
      category_type: "business" | "product" | "place" | "event"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "business_owner"],
      category_type: ["business", "product", "place", "event"],
    },
  },
} as const
