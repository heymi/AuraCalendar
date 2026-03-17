"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarView from "@/components/calendar/CalendarView";
import CreateTaskModal, { ParsedResult } from "@/components/task/CreateTaskModal";
import Sidebar from "@/components/sidebar/Sidebar";
import ChatInput from "@/components/sidebar/ChatInput";
import MobileTabBar, { MobileTab } from "@/components/MobileTabBar";
import MobileListView from "@/components/MobileListView";
import { useCalendar } from "@/hooks/useCalendar";
import { useTasks } from "@/hooks/useTasks";
import { useHighlight } from "@/hooks/useHighlight";

export default function Home() {
  const { year, month, monthKey, goToPrevMonth, goToNextMonth, goToToday } =
    useCalendar();
  const { tasks, loading, createBatch, createNote, updateTask, updateStatus, deleteTask } =
    useTasks(monthKey);
  const { highlight, clearHighlight, isHighlighted } = useHighlight();
  const [showCreate, setShowCreate] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("calendar");

  return (
    <div className="min-h-screen w-full px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 pb-[60px] lg:pb-0">
      <div className="flex gap-4 lg:gap-6 h-full w-full">
        {/* Calendar — always visible on desktop, tab-controlled on mobile */}
        <div className={`flex-1 min-w-0 lg:min-w-[600px] flex flex-col ${mobileTab !== "calendar" ? "hidden lg:flex" : ""}`}>
          <CalendarHeader
            year={year}
            month={month}
            onPrev={goToPrevMonth}
            onNext={goToNextMonth}
            onToday={goToToday}
          />

          {loading ? (
            <div className="flex items-center justify-center py-16 flex-1">
              <div
                className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
              />
            </div>
          ) : (
            <CalendarView
              year={year}
              month={month}
              tasks={tasks}
              isHighlighted={isHighlighted}
              onUpdateStatus={updateStatus}
              onDeleteTask={deleteTask}
              onUpdateTask={updateTask}
            />
          )}
        </div>

        {/* Sidebar — desktop only (always visible on lg+) */}
        <div className="hidden lg:flex flex-col shrink-0 pt-0.5 gap-4 w-[340px] min-w-[300px]">
          <Sidebar
            tasks={tasks}
            onHighlight={highlight}
            onClearHighlight={clearHighlight}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onUpdateStatus={updateStatus}
          />
          <ChatInput onCreateBatch={createBatch} onCreateNote={createNote} />
        </div>

        {/* Mobile list view — only on list tab, hidden on lg+ */}
        {mobileTab === "list" && (
          <div className="flex-1 min-w-0 lg:hidden">
            <MobileListView
              tasks={tasks}
              onHighlight={highlight}
              onClearHighlight={clearHighlight}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onUpdateStatus={updateStatus}
            />
          </div>
        )}
      </div>

      {/* FAB — mobile only, both tabs */}
      <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => setShowCreate(true)}
          style={{
            background: "var(--accent)",
            boxShadow: "0 2px 16px rgba(0,122,255,0.32)",
            bottom: "calc(62px + env(safe-area-inset-bottom, 0px))",
          }}
          className="lg:hidden fixed right-6 sm:right-8 w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] rounded-full text-white flex items-center justify-center"
        >
          <Plus size={20} strokeWidth={2.5} />
        </motion.button>

      {/* Mobile tab bar */}
      <MobileTabBar activeTab={mobileTab} onTabChange={setMobileTab} />

      <CreateTaskModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreateBatch={async (input: string, parsedList: ParsedResult[]) => {
          await createBatch(input, parsedList);
        }}
        onCreateNote={createNote}
      />
    </div>
  );
}
