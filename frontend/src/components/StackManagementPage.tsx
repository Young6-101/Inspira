import { motion } from "framer-motion";
import { StackIcon } from "./StackIcon";
import { Stack } from "../hooks/useStack";
import { AddButton } from "./AddButton";

interface StackManagementPageProps {
    stacks: Stack[];
    onStackClick?: (stack: Stack) => void;
    onAddStack?: () => void;
}

export const StackManagementPage = ({ stacks, onStackClick, onAddStack }: StackManagementPageProps) => {
    if (stacks.length === 0) {
        return null; // 没有 stack 时不渲染第二页
    }

    return (
        <section className="h-screen w-full flex flex-col justify-start items-start pt-12 px-8 flex-shrink-0">
            {/* title */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-16"
            >
                <h2 className="text-5xl sm:text-6xl font-black tracking-tighter text-[#0a86ce]">
                    Stack Management
                </h2>
                <p className="mt-4 font-mono text-sm text-default-400 uppercase tracking-[0.3em]">
                    {stacks.length} {stacks.length === 1 ? 'Stack' : 'Stacks'}
                </p>
            </motion.div>

            {/* Stack + Add Button */}
            <div className="grid grid-cols-5 gap-12">
                {stacks.map((stack, index) => (
                    <motion.div
                        key={stack.id}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                            duration: 0.6,
                            delay: index * 0.1,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                    >
                        <StackIcon
                            name={stack.name}
                            description={`Created on ${new Date(stack.createdAt).toLocaleDateString()}`}
                            onClick={() => onStackClick?.(stack)}
                        />
                    </motion.div>
                ))}

                {/* Add Button */}
                {onAddStack && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                            duration: 0.6,
                            delay: stacks.length * 0.1,
                            ease: [0.16, 1, 0.3, 1]
                        }}
                        className="flex items-center justify-center"
                    >
                        <AddButton onPress={onAddStack} />
                    </motion.div>
                )}
            </div>
        </section>
    );
};
