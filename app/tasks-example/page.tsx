"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";

/**
 * Clerk 공식 문서 예시 기반 Tasks 페이지
 *
 * 이 컴포넌트는 Clerk 공식 문서의 예시를 기반으로 작성되었습니다.
 * @see https://clerk.com/docs/guides/development/integrations/databases/supabase
 */
export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");

  // useUser()는 Clerk가 사용자 데이터를 로드했는지 확인하는 데 사용됩니다
  const { user, isLoaded: isUserLoaded } = useUser();

  // Clerk 세션 토큰을 사용하는 Supabase 클라이언트
  // useClerkSupabaseClient hook 내부에서 useSession()을 사용합니다
  const supabase = useClerkSupabaseClient();

  // 사용자 데이터가 로드된 후 tasks를 가져옵니다
  useEffect(() => {
    if (!isUserLoaded || !user) return;

    async function loadTasks() {
      setLoading(true);
      const { data, error } = await supabase.from("tasks").select();

      if (error) {
        console.error("Error loading tasks:", error);
        setLoading(false);
        return;
      }

      setTasks(data || []);
      setLoading(false);
    }

    loadTasks();
  }, [user, isUserLoaded, supabase]);

  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) return;

    // tasks 테이블에 새 task 삽입
    const { error } = await supabase.from("tasks").insert({
      name,
    });

    if (error) {
      console.error("Error creating task:", error);
      alert("작업 생성에 실패했습니다: " + error.message);
      return;
    }

    // 성공 시 폼 초기화 및 목록 새로고침
    setName("");
    window.location.reload();
  }

  if (!isUserLoaded) {
    return (
      <div className="container mx-auto p-4">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <p>Please sign in to view your tasks.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>

      {loading && <p>Loading tasks...</p>}

      {!loading && tasks.length > 0 && (
        <ul className="space-y-2 mb-6">
          {tasks.map((task: any) => (
            <li
              key={task.id}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              {task.name}
            </li>
          ))}
        </ul>
      )}

      {!loading && tasks.length === 0 && (
        <p className="mb-6 text-gray-500">No tasks found. Create your first task below!</p>
      )}

      <form onSubmit={createTask} className="flex gap-2">
        <input
          autoFocus
          type="text"
          name="name"
          placeholder="Enter new task"
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}

