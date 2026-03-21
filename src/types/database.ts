// ============================================================
//  CampusCircle — TypeScript Types
//  src/types/database.ts
//
//  Tip: regenerate the Database type automatically by running:
//  npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
// ============================================================

// ─── Enums (mirror the SQL enums) ────────────────────────────────────────
export type PostCategory =
  | "food"
  | "housing"
  | "edu"
  | "service"
  | "social"
  | "market"
  | "transport"
  | "events"
  | "warning"
  | "confession";

export type PostLabel =
  | "trending"
  | "cheap_eat"
  | "top_pick"
  | "avoid"
  | "urgent"
  | "free";

export type VoteType = "+1" | "-1";

export type PlaceType =
  | "food"
  | "barber"
  | "tech_shop"
  | "pharmacy"
  | "transport"
  | "laundry"
  | "printing"
  | "gym"
  | "market"
  | "health"
  | "other";

export type ListingCondition =
  | "new"
  | "like_new"
  | "good"
  | "fair"
  | "for_parts";

export type HousingType =
  | "single_room"
  | "shared_room"
  | "studio"
  | "apartment"
  | "hostel";

export type ReportReason =
  | "spam"
  | "harassment"
  | "misinformation"
  | "inappropriate"
  | "scam"
  | "fake_account"
  | "other";

export type ReportTarget =
  | "post"
  | "comment"
  | "place"
  | "listing"
  | "user";

export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export type NotifType =
  | "upvote"
  | "comment"
  | "reply"
  | "mention"
  | "campus_alert"
  | "trust_level_up"
  | "post_hidden"
  | "report_resolved"
  | "follow"
  | "system";

export type AlertSeverity = "urgent" | "warning" | "info" | "lost_found";

export type UserRole = "student" | "moderator" | "admin";

export type PostStatus = "active" | "hidden" | "removed" | "pending_review";

export type EventRsvp = "going" | "maybe" | "not_going";

// ─── Row types ────────────────────────────────────────────────────────────
export type University = {
  id: string;
  name: string;
  short_name: string;
  domain: string;
  city: string;
  country: string;
  logo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  campus_radius_m: number;
  is_active: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  university_email: string | null;
  university_id: string | null;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  faculty: string | null;
  year_of_study: number | null;
  role: UserRole;
  is_verified: boolean;
  trust_score: number;
  trust_level: number;
  anon_posts_today: number;
  anon_reset_date: string;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  university_id: string;
  content: string;
  category: PostCategory;
  label: PostLabel | null;
  is_anonymous: boolean;
  media_urls: string[];
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  score: number;
  upvote_count: number;
  downvote_count: number;
  comment_count: number;
  report_count: number;
  status: PostStatus;
  hidden_reason: string | null;
  created_at: string;
  updated_at: string;
};

// feed_posts view — anonymous user fields are null
export type FeedPost = Omit<Post, "user_id"> & {
  user_id: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  trust_level: number | null;
};

export type Vote = {
  id: string;
  user_id: string;
  post_id: string;
  type: VoteType;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_anonymous: boolean;
  report_count: number;
  status: "active" | "hidden" | "removed";
  created_at: string;
  updated_at: string;
};

export type Place = {
  id: string;
  university_id: string;
  created_by: string;
  name: string;
  type: PlaceType;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  price_range: "budget" | "mid" | "pricey" | null;
  is_verified: boolean;
  verified_by: string | null;
  avg_rating: number;
  review_count: number;
  status: "active" | "hidden" | "removed";
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  content: string | null;
  created_at: string;
  updated_at: string;
};

export type Listing = {
  id: string;
  seller_id: string;
  university_id: string;
  title: string;
  description: string | null;
  price: number | null;
  is_free: boolean;
  condition: ListingCondition | null;
  category: string;
  image_urls: string[];
  is_sold: boolean;
  expires_at: string;
  status: "active" | "sold" | "expired" | "removed";
  created_at: string;
  updated_at: string;
};

export type HousingListing = {
  id: string;
  landlord_id: string;
  university_id: string;
  title: string;
  type: HousingType;
  description: string | null;
  price_per_month: number;
  address: string;
  distance_mins: number | null;
  latitude: number | null;
  longitude: number | null;
  image_urls: string[];
  amenities: string[];
  spots_available: number;
  is_available: boolean;
  status: "active" | "filled" | "removed";
  created_at: string;
  updated_at: string;
};

export type Event = {
  id: string;
  created_by: string;
  university_id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  is_free: boolean;
  category: string;
  cover_image_url: string | null;
  rsvp_count: number;
  status: "active" | "cancelled" | "removed";
  created_at: string;
  updated_at: string;
};

export type StudyGroup = {
  id: string;
  creator_id: string;
  university_id: string;
  name: string;
  subject: string;
  faculty: string | null;
  description: string | null;
  next_session: string | null;
  location_name: string | null;
  max_members: number;
  member_count: number;
  is_open: boolean;
  status: string;
  created_at: string;
};

export type RidePool = {
  id: string;
  driver_id: string;
  university_id: string;
  origin: string;
  destination: string;
  departure_time: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number | null;
  vehicle_info: string | null;
  notes: string | null;
  status: "open" | "full" | "completed" | "cancelled";
  created_at: string;
};

export type Resource = {
  id: string;
  uploaded_by: string;
  university_id: string;
  title: string;
  description: string | null;
  faculty: string | null;
  course_code: string | null;
  year: number | null;
  type: "past_paper" | "notes" | "slides" | "book" | "other";
  file_url: string;
  file_size_kb: number | null;
  download_count: number;
  status: string;
  created_at: string;
};

export type CampusAlert = {
  id: string;
  created_by: string;
  university_id: string;
  title: string;
  body: string;
  severity: AlertSeverity;
  is_official: boolean;
  confirmation_count: number;
  expires_at: string | null;
  status: "active" | "resolved" | "removed";
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotifType;
  title: string;
  body: string | null;
  actor_id: string | null;
  target_type: string | null;
  target_id: string | null;
  deep_link: string | null;
  is_read: boolean;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  target_type: ReportTarget;
  target_id: string;
  reason: ReportReason;
  notes: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
  created_at: string;
};

export type TrustLevelConfig = {
  level: number;
  label: string;
  min_score: number;
  max_score: number | null;
  can_add_places: boolean;
  can_send_dms: boolean;
  can_pin_comments: boolean;
  anon_daily_limit: number;
  can_moderate: boolean;
};

// ─── Joined / enriched types used throughout the UI ──────────────────────

export type ProfileWithUniversity = Profile & {
  universities: Pick<University, "id" | "name" | "short_name" | "domain" | "city"> | null;
};

export type CommentWithAuthor = Comment & {
  profiles: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "trust_level"> | null;
  replies?: CommentWithAuthor[];
};

export type PlaceWithCreator = Place & {
  profiles: Pick<Profile, "id" | "username" | "trust_level">;
};

export type ListingWithSeller = Listing & {
  profiles: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "trust_level">;
};

export type EventWithCreator = Event & {
  profiles: Pick<Profile, "id" | "username" | "display_name">;
  user_rsvp?: EventRsvp | null;
};

export type StudyGroupWithMembers = StudyGroup & {
  study_group_members: Array<{
    user_id: string;
    profiles: Pick<Profile, "id" | "username" | "avatar_url">;
  }>;
  is_member?: boolean;
};

export type RideWithDriver = RidePool & {
  profiles: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "trust_level">;
};

export type ResourceWithUploader = Resource & {
  profiles: Pick<Profile, "id" | "username" | "display_name">;
};

export type AlertWithConfirmation = CampusAlert & {
  profiles: Pick<Profile, "id" | "username" | "role">;
  user_confirmed?: boolean;
};

export type NotificationWithActor = Notification & {
  actor?: Pick<Profile, "id" | "username" | "avatar_url"> | null;
};

// ─── Supabase Database schema type ────────────────────────────────────────
// This is what createClient<Database>() uses for full type safety
// Regenerate with: npx supabase gen types typescript --project-id YOUR_ID

export type Database = {
  public: {
    Tables: {
      universities: {
        Row: University;
        Insert: Omit<University, "id" | "created_at">;
        Update: Partial<Omit<University, "id" | "created_at">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, "id" | "score" | "upvote_count" | "downvote_count" | "comment_count" | "report_count" | "status" | "hidden_reason" | "created_at" | "updated_at">;
        Update: Partial<Omit<Post, "id" | "created_at">>;
      };
      votes: {
        Row: Vote;
        Insert: Omit<Vote, "id" | "created_at">;
        Update: Partial<Omit<Vote, "id" | "created_at">>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, "id" | "report_count" | "status" | "created_at" | "updated_at">;
        Update: Partial<Omit<Comment, "id" | "created_at">>;
      };
      places: {
        Row: Place;
        Insert: Omit<Place, "id" | "avg_rating" | "review_count" | "status" | "created_at" | "updated_at">;
        Update: Partial<Omit<Place, "id" | "created_at">>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Review, "id" | "created_at">>;
      };
      listings: {
        Row: Listing;
        Insert: Omit<Listing, "id" | "is_sold" | "status" | "created_at" | "updated_at">;
        Update: Partial<Omit<Listing, "id" | "created_at">>;
      };
      housing_listings: {
        Row: HousingListing;
        Insert: Omit<HousingListing, "id" | "status" | "created_at" | "updated_at">;
        Update: Partial<Omit<HousingListing, "id" | "created_at">>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, "id" | "rsvp_count" | "status" | "created_at" | "updated_at">;
        Update: Partial<Omit<Event, "id" | "created_at">>;
      };
      event_rsvps: {
        Row: { id: string; event_id: string; user_id: string; status: EventRsvp; created_at: string };
        Insert: { event_id: string; user_id: string; status?: EventRsvp };
        Update: { status?: EventRsvp };
      };
      study_groups: {
        Row: StudyGroup;
        Insert: Omit<StudyGroup, "id" | "member_count" | "created_at">;
        Update: Partial<Omit<StudyGroup, "id" | "created_at">>;
      };
      study_group_members: {
        Row: { group_id: string; user_id: string; joined_at: string };
        Insert: { group_id: string; user_id: string };
        Update: never;
      };
      ride_pool: {
        Row: RidePool;
        Insert: Omit<RidePool, "id" | "status" | "created_at">;
        Update: Partial<Omit<RidePool, "id" | "created_at">>;
      };
      resources: {
        Row: Resource;
        Insert: Omit<Resource, "id" | "download_count" | "status" | "created_at">;
        Update: Partial<Omit<Resource, "id" | "created_at">>;
      };
      campus_alerts: {
        Row: CampusAlert;
        Insert: Omit<CampusAlert, "id" | "confirmation_count" | "status" | "created_at">;
        Update: Partial<Omit<CampusAlert, "id" | "created_at">>;
      };
      alert_confirmations: {
        Row: { alert_id: string; user_id: string; confirmed_at: string };
        Insert: { alert_id: string; user_id: string };
        Update: never;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "status" | "reviewed_by" | "reviewed_at" | "action_taken" | "created_at">;
        Update: Partial<Omit<Report, "id" | "created_at">>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "is_read" | "created_at">;
        Update: { is_read?: boolean };
      };
      trust_level_config: {
        Row: TrustLevelConfig;
        Insert: TrustLevelConfig;
        Update: Partial<TrustLevelConfig>;
      };
      otp_verifications: {
        Row: {
          id: string;
          user_id: string;
          university_email: string;
          otp_hash: string;
          attempts: number;
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          university_email: string;
          otp_hash: string;
          expires_at?: string;
        };
        Update: { attempts?: number; used?: boolean };
      };
    };
    Views: {
      feed_posts: {
        Row: FeedPost;
      };
      trending_posts: {
        Row: FeedPost;
      };
      places_summary: {
        Row: PlaceWithCreator;
      };
    };
    Functions: {
      can_post_anonymous: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      increment_anon_count: {
        Args: { p_user_id: string };
        Returns: void;
      };
      get_campus_feed: {
        Args: {
          p_user_id: string;
          p_category?: PostCategory | null;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: FeedPost[];
      };
      mark_all_notifications_read: {
        Args: { p_user_id: string };
        Returns: void;
      };
    };
    Enums: {
      post_category: PostCategory;
      post_label: PostLabel;
      vote_type: VoteType;
      place_type: PlaceType;
      listing_condition: ListingCondition;
      housing_type: HousingType;
      report_reason: ReportReason;
      report_target: ReportTarget;
      report_status: ReportStatus;
      notif_type: NotifType;
      alert_severity: AlertSeverity;
      user_role: UserRole;
      event_rsvp: EventRsvp;
    };
  };
};
