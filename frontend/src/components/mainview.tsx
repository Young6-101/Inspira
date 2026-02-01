import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Input } from "@heroui/react";
import { StackDashboard } from "./StackDashboard";
import { useScramble } from "../hooks/UseScramble";

export default function MainView({ stacks, onAddStack }: { stacks: any[], onAddStack: (n: string) => void }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [name, setName] = useState("");
  const { displayChar, trigger } = useScramble("From chaos to clarity.");
  const hasStacks = stacks.length > 0;

  useEffect(() => { trigger(); }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#f9f9f9]">
      <StackDashboard stacks={stacks}>
        
        {/* --- 第一页：Hero --- */}
        <section className="h-screen w-full flex flex-col justify-center items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* 只保留这一个带动效的标题 */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter flex items-center gap-4 whitespace-nowrap">
              <span className="text-default-900">Scatter Now.</span>
              <motion.span 
                whileHover="hover"
                className="relative text-[#0a86ce] px-2 overflow-hidden cursor-default"
              >
                Think later.
                <motion.div 
                  variants={{ hover: { x: ["-100%", "200%"] } }}
                  transition={{ duration: 0.8, ease: "linear" }}
                  className="absolute inset-0 w-full h-full skew-x-[-25deg] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none"
                />
              </motion.span>
            </h1>

            <p onMouseEnter={trigger} className="mt-8 font-mono text-xl text-default-400 uppercase tracking-[0.4em] cursor-pointer">
              {displayChar}
            </p>
            
            <Button 
              onPress={onOpen}
              className="mt-16 w-20 h-20 bg-[#0a86ce] text-white text-4xl rounded-full shadow-2xl hover:scale-110 transition-transform font-light"
            >
              +
            </Button>
          </motion.div>
        </section>

        {/* --- 第二页：Management (二级标题布局) --- */}
        {hasStacks && (
          <section className="h-screen w-full p-16 flex flex-col items-start justify-start relative">
            <h2 className="text-5xl font-black text-[#0a86ce] tracking-tighter uppercase opacity-80">
              Stack<br />Management
            </h2>
            {/* 提示：3D 文件夹会自动浮现在这个标题下方的空白区域 */}
          </section>
        )}
      </StackDashboard>

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