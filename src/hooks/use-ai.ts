import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAI = () => {
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async (payload: any) => {
    setLoading(true);
    try {
      // Note: Edge functions might still be named 'Groq' in Supabase
      const { data, error } = await supabase.functions.invoke("Groq", { body: payload });
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading } as const;
};

export default useAI;
