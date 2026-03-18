export interface Task {
  id: string;
  title: string;
  original_input: string | null;
  icon: string;
  icon_color: string;
  start_date: string;
  end_date: string | null;
  notes: string;
  status: "pending" | "in_progress" | "completed";
  type: "task" | "note";
  user_id: string;
  created_at: string;
  updated_at: string;
}
