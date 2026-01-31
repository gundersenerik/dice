-- Create generations table
CREATE TABLE public.generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User information
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,

    -- Template information
    template_id TEXT NOT NULL,
    template_name TEXT NOT NULL,
    template_version INTEGER NOT NULL,

    -- Input data
    user_variables JSONB NOT NULL DEFAULT '{}',
    compiled_prompt TEXT NOT NULL,

    -- Model information
    model TEXT NOT NULL,
    provider TEXT NOT NULL,

    -- Output data
    generated_content TEXT,

    -- Metrics
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    cost_usd DECIMAL(10, 6),
    duration_ms INTEGER,

    -- Rating
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    rating_comment TEXT,
    rated_at TIMESTAMPTZ,

    -- Tracing
    langfuse_trace_id TEXT,
    portkey_request_id TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Policies for generations
CREATE POLICY "Users can view own generations"
    ON public.generations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
    ON public.generations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations"
    ON public.generations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all generations
CREATE POLICY "Admins can view all generations"
    ON public.generations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Update trigger
CREATE TRIGGER update_generations_updated_at
    BEFORE UPDATE ON public.generations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for common queries
CREATE INDEX idx_generations_user_id ON public.generations(user_id);
CREATE INDEX idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX idx_generations_template_id ON public.generations(template_id);
CREATE INDEX idx_generations_model ON public.generations(model);
CREATE INDEX idx_generations_status ON public.generations(status);
CREATE INDEX idx_generations_rating ON public.generations(rating) WHERE rating IS NOT NULL;
CREATE INDEX idx_generations_langfuse_trace ON public.generations(langfuse_trace_id);

-- Composite index for user history queries
CREATE INDEX idx_generations_user_history
    ON public.generations(user_id, created_at DESC);
