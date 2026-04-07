-- Create the messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  room_id text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  text text,
  file_url text,
  file_name text,
  file_type text,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_image text
);

-- Create the reactions table
CREATE TABLE IF NOT EXISTS chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  message_id uuid REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

-- Enable Realtime (optional but good to have)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_reactions;

-- Set up basic RLS (Allow everyone to read/write for now)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read chat_messages" ON chat_messages FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert chat_messages" ON chat_messages FOR INSERT TO public WITH CHECK (true);

ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read chat_reactions" ON chat_reactions FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert chat_reactions" ON chat_reactions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public delete chat_reactions" ON chat_reactions FOR DELETE TO public USING (true);
