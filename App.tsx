// App.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "./SupabaseClient";

import AuthScreen from "./AuthScreen";
import AccueilConnected from "./screens/AccueilConnected"; // <-- default import
import ResetPasswordScreen from "./ResetPasswordScreen";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [needsReset, setNeedsReset] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setBooted(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess ?? null);
      if (event === "PASSWORD_RECOVERY") setNeedsReset(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!booted) return null;
  if (needsReset) return <ResetPasswordScreen onDone={() => setNeedsReset(false)} />;
  if (session) return <AccueilConnected />;

  return <AuthScreen />;
}
