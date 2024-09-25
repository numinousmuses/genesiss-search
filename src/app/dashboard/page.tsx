/* eslint-disable */

"use client"
import styles from "./dashboard.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {

    const [session, setSession] = useState<{
        userId: string;
        email: string;
        username: string;
        docks?: any;
      } | null>(null);

    const router = useRouter();

    useEffect(() => {
        const fetchSession = async () => {
        try {
            const response = await fetch("/api/auth/session");
            if (response.ok) {
            const data = await response.json();
            setSession(data);
            } else {
            router.push("/login");
            }
        } catch (error) {
            console.error("Error fetching session:", error);
            router.push("/login");
        }
        };

        fetchSession();
    }, [router]);

    return (
        <div className={styles.page}>
            <h1>Dashboard</h1>
        </div>
    );
}