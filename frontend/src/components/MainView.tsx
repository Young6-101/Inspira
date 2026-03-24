import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Input } from "@heroui/react";
import { useScramble } from "../hooks/useScramble";
import { StackManagementPage } from "./StackManagementPage";
import { AddButton } from "./AddButton";
import { StackDetailPage } from "./StackDetailPage";
import { Stack } from "../hooks/useStack";

export default function MainView({ stacks, onAddStack }: { stacks: Stack[], onAddStack: (n: string) => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [name, setName] = useState("");
  const { displayText, trigger } = useScramble("From chaos to clarity.");
  const [showManagement, setShowManagement] = useState(false);
  const [selectedStack, setSelectedStack] = useState<Stack | null>(null);

  useEffect(() => {
    trigger();
  }, [trigger]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#f9f9f9]">

      {/* --- Hero Page --- */}
      <section
        onClick={() => {
          console.log('Section clicked, stacks:', stacks.length);
          if (stacks.length > 0) {
            setShowManagement(true);
          }
        }}
        className={`h-screen w-full flex flex-col justify-center items-center flex-shrink-0 relative ${stacks.length > 0 ? 'cursor-pointer' : ''}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter flex flex-col sm:flex-row items-center gap-2 sm:gap-4 px-4">
            <span className="text-default-900">Scatter Now.</span>
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

          <p onMouseEnter={trigger} className="mt-8 font-mono text-xl text-default-400 uppercase tracking-[0.4em] cursor-pointer">
            {displayText}
          </p>

          <div onClick={(e) => e.stopPropagation()} className="mt-16">
            <AddButton onPress={onOpen} />
          </div>
        </motion.div>

      </section>

      {/* Hint at bottom */}
      {stacks.length > 0 && (
        <p className="fixed bottom-8 text-sm text-default-400 z-10" style={{ left: 'calc(224px + (100% - 224px) / 2)', transform: 'translateX(-50%)' }}>
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
            className="fixed top-0 bottom-0 right-0 bg-[#f9f9f9] z-50 overflow-y-auto"
            style={{ left: '224px' }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowManagement(false)}
              className="fixed top-8 right-8 w-12 h-12 rounded-full bg-default-900 text-white flex items-center justify-center hover:scale-110 transition-transform z-10"
            >
              ✕
            </button>

            <StackManagementPage
              stacks={stacks}
              onAddStack={onOpen}
              onStackClick={(stack) => {
                setSelectedStack(stack);
                setShowManagement(false);
              }}
            />
          </motion.div>
        )}

        {/* --- Stack Detail Page --- */}
        {selectedStack && (
          <div className="fixed top-0 bottom-0 right-0 z-50" style={{ left: '224px' }}>
            <StackDetailPage
              stack={selectedStack}
              onClose={() => {
                setSelectedStack(null);
                setShowManagement(true);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" className="z-[9999]">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="font-bold text-[#0a86ce]">New Stack</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus label="Stack Name" variant="bordered"
                  value={name} onValueChange={setName}
                  onKeyDown={(e) => e.key === 'Enter' && (onAddStack(name), setName(""), onClose())}
                />
              </ModalBody>
              <ModalFooter>
                <Button className="bg-[#0a86ce] text-white font-bold" onPress={() => { onAddStack(name); setName(""); onClose(); }}>Confirm</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}