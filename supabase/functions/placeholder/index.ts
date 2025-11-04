// Placeholder edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(() => {
  return new Response(JSON.stringify({ message: "placeholder" }), {
    headers: { "Content-Type": "application/json" },
  });
});
