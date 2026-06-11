import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const PRICE_TO_PLAN = {
  "price_1TeHGSQvs8aipB6ZWZ3rlBEE": "premium",
  "price_1TeHHmQvs8aipB6ZW7edIWGw": "elite",
};

export function useSubscription(user) {
  const [plan, setPlan] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPlan(null);
      setIsActive(false);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "customers", user.uid, "subscriptions"),
      where("status", "in", ["active", "trialing"])
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setPlan(null);
          setIsActive(false);
        } else {
          const data = snap.docs[0].data();
          // price is a DocumentReference — .id is the Stripe price ID
          const priceId = data.price?.id || data.items?.[0]?.price?.id || "";
          setPlan(PRICE_TO_PLAN[priceId] || "premium");
          setIsActive(true);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  return { plan, isActive, loading };
}
