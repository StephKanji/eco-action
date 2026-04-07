"use client";

import { createClient } from "@/supabase/client";
import { useMemo } from "react";

export function useSupabase() {
    const supabase = useMemo(() => createClient(), []);
    return supabase;
}