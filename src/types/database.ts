// src/types/database.ts
// ─────────────────────────────────────────────────────────────────────────
// This file was written by hand to match the migration schema exactly.
// You can later regenerate it automatically with:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_ID \
//     --schema public > src/types/database.ts
// ─────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Enums ────────────────────────────────────────────────────────────────
export type PostCategory =
  | "food" | "housing" | "edu" | "service" | "social"
  | "market" | "transport" | "events" | "warning" | "confession"

export type PostLabel =
  | "trending" | "cheap_eat" | "top_pick" | "avoid" | "urgent" | "free"

export type VoteType = "+1" | "-1"

export type PlaceType =
  | "food" | "barber" | "tech_shop" | "pharmacy" | "transport"
  | "laundry" | "printing" | "gym" | "market" | "health" | "other"

export type ListingCondition =
  | "new" | "like_new" | "good" | "fair" | "for_parts"

export type HousingType =
  | "single_room" | "shared_room" | "studio" | "apartment" | "hostel"

export type ReportReason =
  | "spam" | "harassment" | "misinformation" | "inappropriate"
  | "scam" | "fake_account" | "other"

export type ReportTarget =
  | "post" | "comment" | "place" | "listing" | "user"

export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed"

export type NotifType =
  | "upvote" | "comment" | "reply" | "mention" | "campus_alert"
  | "trust_level_up" | "post_hidden" | "report_resolved" | "follow" | "system"

export type AlertSeverity = "urgent" | "warning" | "info" | "lost_found"

export type UserRole = "student" | "moderator" | "admin"

export type PostStatus = "active" | "hidden" | "removed" | "pending_review"

export type EventRsvpStatus = "going" | "maybe" | "not_going"

// ── Row types (what SELECT returns) ─────────────────────────────────────
export type University = {
  id: string
  name: string
  short_name: string
  domain: string
  city: string
  country: string
  logo_url: string | null
  latitude: number | null
  longitude: number | null
  campus_radius_m: number
  is_active: boolean
  created_at: string
}

export type Profile = {
  id: string
  email: string
  university_email: string | null
  university_id: string | null
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  faculty: string | null
  year_of_study: number | null
  role: UserRole
  is_verified: boolean
  trust_score: number
  trust_level: number
  anon_posts_today: number
  anon_reset_date: string
  is_banned: boolean
  ban_reason: string | null
  created_at: string
  updated_at: string
}

export type Post = {
  id: string
  user_id: string
  university_id: string
  content: string
  category: PostCategory
  label: PostLabel | null
  is_anonymous: boolean
  media_urls: string[]
  location_name: string | null
  latitude: number | null
  longitude: number | null
  score: number
  upvote_count: number
  downvote_count: number
  comment_count: number
  report_count: number
  status: PostStatus
  hidden_reason: string | null
  created_at: string
  updated_at: string
}

// feed_posts view — anonymous fields are null
export type FeedPost = {
  id: string
  university_id: string
  content: string
  category: PostCategory
  label: PostLabel | null
  is_anonymous: boolean
  media_urls: string[]
  location_name: string | null
  latitude: number | null
  longitude: number | null
  score: number
  upvote_count: number
  downvote_count: number
  comment_count: number
  status: PostStatus
  created_at: string
  // null when anonymous
  user_id: string | null
  username: string | null
  display_name: string | null
  avatar_url: string | null
  trust_level: number | null
}

export type Vote = {
  id: string
  user_id: string
  post_id: string
  type: VoteType
  created_at: string
}

export type Comment = {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  is_anonymous: boolean
  report_count: number
  status: "active" | "hidden" | "removed"
  created_at: string
  updated_at: string
}

export type Place = {
  id: string
  university_id: string
  created_by: string
  name: string
  type: PlaceType
  description: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  cover_image_url: string | null
  price_range: "budget" | "mid" | "pricey" | null
  is_verified: boolean
  verified_by: string | null
  avg_rating: number
  review_count: number
  status: "active" | "hidden" | "removed"
  created_at: string
  updated_at: string
}

export type Review = {
  id: string
  place_id: string
  user_id: string
  rating: number
  content: string | null
  created_at: string
  updated_at: string
}

export type Listing = {
  id: string
  seller_id: string
  university_id: string
  title: string
  description: string | null
  price: number | null
  is_free: boolean
  condition: ListingCondition | null
  category: string
  image_urls: string[]
  is_sold: boolean
  expires_at: string
  status: "active" | "sold" | "expired" | "removed"
  created_at: string
  updated_at: string
}

export type HousingListing = {
  id: string
  landlord_id: string
  university_id: string
  title: string
  type: HousingType
  description: string | null
  price_per_month: number
  address: string
  distance_mins: number | null
  latitude: number | null
  longitude: number | null
  image_urls: string[]
  amenities: string[]
  spots_available: number
  is_available: boolean
  status: "active" | "filled" | "removed"
  created_at: string
  updated_at: string
}

export type Event = {
  id: string
  created_by: string
  university_id: string
  title: string
  description: string | null
  location_name: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  is_free: boolean
  category: string
  cover_image_url: string | null
  rsvp_count: number
  status: "active" | "cancelled" | "removed"
  created_at: string
  updated_at: string
}

export type StudyGroup = {
  id: string
  creator_id: string
  university_id: string
  name: string
  subject: string
  faculty: string | null
  description: string | null
  next_session: string | null
  location_name: string | null
  max_members: number
  member_count: number
  is_open: boolean
  status: string
  created_at: string
}

export type RidePool = {
  id: string
  driver_id: string
  university_id: string
  origin: string
  destination: string
  departure_time: string
  seats_total: number
  seats_available: number
  price_per_seat: number | null
  vehicle_info: string | null
  notes: string | null
  status: "open" | "full" | "completed" | "cancelled"
  created_at: string
}

export type Resource = {
  id: string
  uploaded_by: string
  university_id: string
  title: string
  description: string | null
  faculty: string | null
  course_code: string | null
  year: number | null
  type: "past_paper" | "notes" | "slides" | "book" | "other"
  file_url: string
  file_size_kb: number | null
  download_count: number
  status: string
  created_at: string
}

export type CampusAlert = {
  id: string
  created_by: string
  university_id: string
  title: string
  body: string
  severity: AlertSeverity
  is_official: boolean
  confirmation_count: number
  expires_at: string | null
  status: "active" | "resolved" | "removed"
  created_at: string
}

export type Notification = {
  id: string
  user_id: string
  type: NotifType
  title: string
  body: string | null
  actor_id: string | null
  target_type: string | null
  target_id: string | null
  deep_link: string | null
  is_read: boolean
  created_at: string
}

export type Report = {
  id: string
  reporter_id: string
  target_type: ReportTarget
  target_id: string
  reason: ReportReason
  notes: string | null
  status: ReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  action_taken: string | null
  created_at: string
}

export type TrustLevelConfig = {
  level: number
  label: string
  min_score: number
  max_score: number | null
  can_add_places: boolean
  can_send_dms: boolean
  can_pin_comments: boolean
  anon_daily_limit: number
  can_moderate: boolean
}

export type OtpVerification = {
  id: string
  user_id: string
  university_email: string
  otp_hash: string
  attempts: number
  expires_at: string
  used: boolean
  created_at: string
}

// ── Joined / enriched types used in UI ──────────────────────────────────
export type ProfileWithUniversity = Profile & {
  universities: Pick<University, "id" | "name" | "short_name" | "domain" | "city"> | null
}

export type CommentWithAuthor = Comment & {
  profiles: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "trust_level"> | null
  replies?: CommentWithAuthor[]
}

// ── Database schema — THIS is what createClient<Database>() uses ─────────
// The shape must exactly match what Supabase's generated types look like.
// Every table needs Row, Insert, and Update.
export type Database = {
  public: {
    Tables: {
      universities: {
        Row: University
        Insert: Omit<University, "id" | "created_at">
        Update: Partial<Omit<University, "id" | "created_at">>
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, "created_at" | "updated_at">
        Update: Partial<Omit<Profile, "id" | "created_at">>
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            referencedRelation: "universities"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: Post
        Insert: Omit<Post,
          "id" | "score" | "upvote_count" | "downvote_count" |
          "comment_count" | "report_count" | "status" |
          "hidden_reason" | "created_at" | "updated_at">
        Update: Partial<Omit<Post, "id" | "created_at">>
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_university_id_fkey"
            columns: ["university_id"]
            referencedRelation: "universities"
            referencedColumns: ["id"]
          }
        ]
      }
      votes: {
        Row: Vote
        Insert: Omit<Vote, "id" | "created_at">
        Update: Pick<Vote, "type">
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, "id" | "report_count" | "status" | "created_at" | "updated_at">
        Update: Partial<Omit<Comment, "id" | "created_at">>
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      places: {
        Row: Place
        Insert: Omit<Place, "id" | "avg_rating" | "review_count" | "status" | "created_at" | "updated_at">
        Update: Partial<Omit<Place, "id" | "created_at">>
        Relationships: []
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Review, "id" | "created_at">>
        Relationships: []
      }
      listings: {
        Row: Listing
        Insert: Omit<Listing, "id" | "is_sold" | "status" | "created_at" | "updated_at">
        Update: Partial<Omit<Listing, "id" | "created_at">>
        Relationships: []
      }
      housing_listings: {
        Row: HousingListing
        Insert: Omit<HousingListing, "id" | "status" | "created_at" | "updated_at">
        Update: Partial<Omit<HousingListing, "id" | "created_at">>
        Relationships: []
      }
      events: {
        Row: Event
        Insert: Omit<Event, "id" | "rsvp_count" | "status" | "created_at" | "updated_at">
        Update: Partial<Omit<Event, "id" | "created_at">>
        Relationships: []
      }
      event_rsvps: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: EventRsvpStatus
          created_at: string
        }
        Insert: { event_id: string; user_id: string; status?: EventRsvpStatus }
        Update: { status?: EventRsvpStatus }
        Relationships: []
      }
      study_groups: {
        Row: StudyGroup
        Insert: Omit<StudyGroup, "id" | "member_count" | "created_at">
        Update: Partial<Omit<StudyGroup, "id" | "created_at">>
        Relationships: []
      }
      study_group_members: {
        Row: { group_id: string; user_id: string; joined_at: string }
        Insert: { group_id: string; user_id: string }
        Update: never
        Relationships: []
      }
      ride_pool: {
        Row: RidePool
        Insert: Omit<RidePool, "id" | "status" | "created_at">
        Update: Partial<Omit<RidePool, "id" | "created_at">>
        Relationships: []
      }
      resources: {
        Row: Resource
        Insert: Omit<Resource, "id" | "download_count" | "status" | "created_at">
        Update: Partial<Omit<Resource, "id" | "created_at">>
        Relationships: []
      }
      campus_alerts: {
        Row: CampusAlert
        Insert: Omit<CampusAlert, "id" | "confirmation_count" | "status" | "created_at">
        Update: Partial<Omit<CampusAlert, "id" | "created_at">>
        Relationships: []
      }
      alert_confirmations: {
        Row: { alert_id: string; user_id: string; confirmed_at: string }
        Insert: { alert_id: string; user_id: string }
        Update: never
        Relationships: []
      }
      reports: {
        Row: Report
        Insert: Omit<Report,
          "id" | "status" | "reviewed_by" |
          "reviewed_at" | "action_taken" | "created_at">
        Update: Partial<Omit<Report, "id" | "created_at">>
        Relationships: []
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, "id" | "is_read" | "created_at">
        Update: { is_read?: boolean }
        Relationships: []
      }
      trust_level_config: {
        Row: TrustLevelConfig
        Insert: TrustLevelConfig
        Update: Partial<TrustLevelConfig>
        Relationships: []
      }
      otp_verifications: {
        Row: OtpVerification
        Insert: Omit<OtpVerification, "id" | "attempts" | "used" | "created_at">
        Update: { attempts?: number; used?: boolean }
        Relationships: []
      }
    }
    Views: {
      feed_posts: {
        Row: FeedPost
        Relationships: []
      }
      trending_posts: {
        Row: FeedPost
        Relationships: []
      }
    }
    Functions: {
      can_post_anonymous: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      increment_anon_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      get_campus_feed: {
        Args: {
          p_user_id: string
          p_category?: PostCategory | null
          p_limit?: number
          p_offset?: number
        }
        Returns: FeedPost[]
      }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      post_category: PostCategory
      post_label: PostLabel
      vote_type: VoteType
      place_type: PlaceType
      listing_condition: ListingCondition
      housing_type: HousingType
      report_reason: ReportReason
      report_target: ReportTarget
      report_status: ReportStatus
      notif_type: NotifType
      alert_severity: AlertSeverity
      user_role: UserRole
      event_rsvp: EventRsvpStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
