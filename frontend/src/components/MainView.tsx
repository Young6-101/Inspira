import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useScramble } from "../hooks/useScramble";
import { StackManagementPage } from "./StackManagementPage";
import { AddButton } from "./AddButton";
import { StackDetailPage } from "./StackDetailPage";
import { Stack } from "../hooks/useStack";

export default function MainView({
  stacks,
  onAddStack,
  activeStackId,
  setActiveStackId,
  showManagement,
  setShowManagement,
  updateFileCount
}: {
  stacks: Stack[],
  onAddStack: (n: string) => void,
  activeStackId: string | null,
  setActiveStackId: (id: string | null) => void,
  showManagement: boolean,
  setShowManagement: (show: boolean) => void,
  updateFileCount: (id: string, count: number) => void
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const { displayText, trigger } = useScramble("From chaos to clarity.");
  const activeStack = stacks.find(s => s.id === activeStackId) || null;

  useEffect(() => {
    trigger();
  }, [trigger]);

  return (
    <div className="w-full h-full min-h-0 relative overflow-hidden bg-[#f3eced]">

      {/* --- Hero Page --- */}
      <section
        onClick={() => {
          console.log('Section clicked, stacks:', stacks.length);
          if (stacks.length > 0) {
            setShowManagement(true);
          }
        }}
        className={`h-full w-full flex flex-col justify-center items-center flex-shrink-0 relative ${stacks.length > 0 ? 'cursor-pointer' : ''}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >

          <h1 className="font-['Inter'] text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-4">
            <span className="text-gray-900">Scatter Now.</span>
            <motion.span
              whileHover="hover"
              className="relative text-[#0a86ce] px-2 overflow-hidden cursor-default"
            >
              Think later.
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                variants={{ hover: { x: ["-100%", "200%"] } }}
                transition={{ duration: 0.8, ease: "linear", repeat: 0 }}
                whileHover={{ x: ["0%", "200%"] }}
                className="absolute inset-0 w-full h-full skew-x-[-25deg] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
              />
            </motion.span>
          </h1>

          <p onMouseEnter={trigger} className="mt-8 font-sans font-medium text-xl text-gray-400 uppercase tracking-[0.4em] cursor-pointer">
            {displayText}
          </p>

          <div onClick={(e) => e.stopPropagation()} className="mt-16">
            <AddButton onPress={() => setIsModalOpen(true)} />
          </div>
        </motion.div>

      </section>

      {/* Hint at bottom */}
      {stacks.length > 0 && !activeStack && !showManagement && (
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-gray-400 z-10 pointer-events-none">
          Click anywhere to view stacks
        </p>
      )}

      {/* --- Stack Management Overlay --- */}
      <AnimatePresence>
        {showManagement && stacks.length > 0 && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-[#f3eced] z-50 overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={() => setShowManagement(false)}
              className="absolute top-8 right-8 w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center hover:scale-110 transition-transform z-10"
            >
              ✕
            </button>

            <StackManagementPage
              stacks={stacks}
              onAddStack={() => setIsModalOpen(true)}
              onStackClick={(stack) => {
                setActiveStackId(stack.id);
                setShowManagement(false);
              }}
            />
          </motion.div>
        )}

        {/* --- Stack Detail Page --- */}
        {activeStack && (
          <div className="absolute inset-0 z-50">
            <StackDetailPage
              stack={activeStack}
              onClose={() => {
                setActiveStackId(null);
                setShowManagement(true);
              }}
              updateFileCount={updateFileCount}
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden flex flex-col gap-4"
            >
              <h3 className="text-xl font-bold text-[#0a86ce]">New Stack</h3>
              <div className="mt-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Stack Name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0a86ce] text-gray-800 bg-gray-50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onAddStack(name);
                      setName("");
                      setIsModalOpen(false);
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  className="px-6 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2.5 bg-[#0a86ce] text-white font-bold rounded-xl hover:bg-[#0970a8] transition-colors"
                  onClick={() => {
                    onAddStack(name);
                    setName("");
                    setIsModalOpen(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}