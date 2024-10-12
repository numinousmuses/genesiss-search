/* eslint-disable */
"use client";
import styles from "./workflows.module.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface WorkflowOutput {
  runDate: string;
  output: string;
  status: string;
  creditsConsumed: number;
}

interface Workflow {
  title: string;
  description: string;
  frequency: string;
  createdAt: string;
  outputs: WorkflowOutput[];
}

export default function Workflows() {
  const [session, setSession] = useState<{
    userId: string;
    email: string;
    username: string;
    docks?: any;
  } | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [expandedOutputs, setExpandedOutputs] = useState<{ [key: number]: boolean }>({});
  const [sortOption, setSortOption] = useState<string>("Date Created");
  const router = useRouter();

  const sampleWorkflows: Workflow[] = [
    {
      title: "Daily Report Generation",
      description: "Generates a daily report summarizing sales, user engagement, and key metrics.",
      frequency: "Daily",
      createdAt: "2024-09-01T09:00:00Z",
      outputs: [
        {
          runDate: "2024-10-10T09:00:00Z",
          output: "Report generated successfully with 1000 new entries.",
          status: "Complete",
          creditsConsumed: 50,
        },
        {
          runDate: "2024-10-09T09:00:00Z",
          output: "Report generated with some errors, missing data for 2 hours.",
          status: "Partial",
          creditsConsumed: 45,
        },
      ],
    },
    {
      title: "Weekly Analytics Summary",
      description: "Compiles weekly analytics on user traffic, conversions, and ad performance.",
      frequency: "Weekly",
      createdAt: "2024-09-01T09:00:00Z",
      outputs: [
        {
          runDate: "2024-10-06T09:00:00Z",
          output: "Weekly analytics generated successfully.",
          status: "Complete",
          creditsConsumed: 100,
        },
      ],
    },
    {
      title: "Monthly Data Backup",
      description: "Performs a complete data backup for the past month.",
      frequency: "Monthly",
      createdAt: "2024-08-01T09:00:00Z",
      outputs: [
        {
          runDate: "2024-09-30T09:00:00Z",
          output: "Backup completed successfully with no errors.",
          status: "Complete",
          creditsConsumed: 150,
        },
        {
          runDate: "2024-08-31T09:00:00Z",
          output: "Backup completed successfully.",
          status: "Complete",
          creditsConsumed: 140,
        },
      ],
    },
  ];

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setSession(data);
          fetchWorkflows(data.userId);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        router.push("/login");
      }
    };

    if (!session) {
      fetchSession();
    }
  }, [router, session]);

  const fetchWorkflows = async (userId: string) => {
    setWorkflows(sampleWorkflows);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const selectWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setExpandedOutputs({});
  };

  const backToCards = () => {
    setSelectedWorkflow(null);
  };

  const toggleOutput = (index: number) => {
    setExpandedOutputs((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const expandAllOutputs = () => {
    if (selectedWorkflow) {
      const allExpanded = selectedWorkflow.outputs.reduce((acc, _, index) => {
        acc[index] = true;
        return acc;
      }, {} as { [key: number]: boolean });
      setExpandedOutputs(allExpanded);
    }
  };

  const collapseAllOutputs = () => {
    setExpandedOutputs({});
  };

  const sortOutputs = () => {
    if (!selectedWorkflow) return [];

    const sortedOutputs = [...selectedWorkflow.outputs];
    switch (sortOption) {
      case "Date Created":
        return sortedOutputs.sort((a, b) => new Date(a.runDate).getTime() - new Date(b.runDate).getTime());
      case "Title":
        return sortedOutputs.sort((a, b) => a.output.localeCompare(b.output));
      case "Last Run":
        return sortedOutputs.sort((a, b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime());
      case "First Run":
        return sortedOutputs.sort((a, b) => new Date(a.runDate).getTime() - new Date(b.runDate).getTime());
      case "Credits Consumed":
        return sortedOutputs.sort((a, b) => b.creditsConsumed - a.creditsConsumed);
      default:
        return sortedOutputs;
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  const calculateAverageCredits = () => {
    if (!selectedWorkflow) return 0;
    const total = selectedWorkflow.outputs.reduce((sum, output) => sum + output.creditsConsumed, 0);
    return (total / selectedWorkflow.outputs.length).toFixed(2);
  };

  const calculateTotalCredits = () => {
    if (!selectedWorkflow) return 0;
    return selectedWorkflow.outputs.reduce((sum, output) => sum + output.creditsConsumed, 0);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logoText}>
          <a href="/">GENESISS <span className={styles.logospan}>AGENTS</span></a>
        </div>
        <div className={styles.session}>
          {session ? (
            <div className={styles.sessionText}>
              <p className={styles.username}>Workflows</p>
            </div>
          ) : (
            <p className={styles.sessionText}>Loading...</p>
          )}
        </div>
        <div className={styles.settings}>
          <button className={styles.logoutButton} onClick={() => router.push("/workflow/new")}>New Workflow</button>
          <button onClick={() => router.push("/dashboard")} className={styles.logoutButton}>Back to Chats</button>
          <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
        </div>
      </div>

      <div className={styles.content}>
        {selectedWorkflow ? (
          <div className={styles.workflowDetail}>
            <button onClick={backToCards}>Back to Card View</button>
            <div className={styles.workflowMainInfo}>
              <h2>{selectedWorkflow.title}</h2>
              <p>{selectedWorkflow.description}</p>
              <p>Status: {selectedWorkflow.outputs[selectedWorkflow.outputs.length - 1]?.status}</p>
              <p>Frequency: {selectedWorkflow.frequency}</p>
              <p>Created: {selectedWorkflow.createdAt}</p>
              <p>Last Run: {selectedWorkflow.outputs[selectedWorkflow.outputs.length - 1]?.runDate}</p>
            </div>

            <div className={styles.workflowOutputs}>
              <button onClick={expandAllOutputs}>Expand All</button>
              <button onClick={collapseAllOutputs}>Collapse All</button>
              <p>Organize by:</p>
              <select value={sortOption} onChange={handleSortChange}>
                <option>Date Created</option>
                <option>Title</option>
                <option>Last Run</option>
                <option>First Run</option>
                <option>Credits Consumed</option>
              </select>
              {sortOutputs().map((output, index) => (
                <div
                  key={index}
                  className={`${styles.outputCard} ${expandedOutputs[index] ? styles.expanded : ''}`}
                  onClick={() => toggleOutput(index)}
                >
                  <p>Date: {output.runDate} | Status: {output.status}</p>
                  <p>Credits Consumed: {output.creditsConsumed}</p>
                  {expandedOutputs[index] && (
                    <div className={styles.outputContent}>
                      <p>{output.output}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p>Average Credits Consumed per Run: {calculateAverageCredits()}</p>
            <p>Total Credits Consumed: {calculateTotalCredits()}</p>
          </div>
        ) : (
          <div className={styles.workflowCards}>
            {workflows.map((workflow, index) => (
              <div key={index} className={styles.workflowCard} onClick={() => selectWorkflow(workflow)}>
                <h3>{workflow.title}</h3>
                <p>{workflow.description.slice(0, 50)}...</p>
                <p>Frequency: {workflow.frequency}</p>
                <p>Last Run: {workflow.outputs[workflow.outputs.length - 1]?.runDate}</p>
                <p>Status: {workflow.outputs[workflow.outputs.length - 1]?.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.footer}></div>
    </div>
  );
}
