import React, { useEffect, useRef, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Send } from 'lucide-react';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { AlertMessage } from '../../types';

export default function AlertChatThread({
    reportId,
    currentUserId,
    currentUserRole,
    currentUserName
}: {
    reportId: string;
    currentUserId: string;
    currentUserRole: 'admin' | 'guardian';
    currentUserName: string;
}) {
    const [messages, setMessages] = useState<AlertMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isFirebaseConfigured || !db) {
            setLoading(false);
            return;
        }

        const messagesRef = collection(db, 'reports', reportId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgList = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
                } as AlertMessage;
            });
            setMessages(msgList);
            setLoading(false);

            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 50);
        });

        return () => unsubscribe();
    }, [reportId]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !isFirebaseConfigured || !db) return;

        const messageData = {
            reportId,
            senderId: currentUserId,
            senderRole: currentUserRole,
            senderName: currentUserName,
            text: newMessage.trim(),
            createdAt: serverTimestamp()
        };

        setNewMessage('');

        try {
            const messagesRef = collection(db, 'reports', reportId, 'messages');
            await addDoc(messagesRef, messageData);
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-sm text-slate-500">Loading messages...</div>;
    }

    return (
        <div className="flex flex-col h-[60vh] md:h-[500px] w-full bg-[#f8fafc] dark:bg-[#0f1625] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
            >
                {messages.length === 0 ? (
                    <div className="h-full grid place-items-center text-center px-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No messages yet.<br />
                            Start the conversation regarding this alert.
                        </p>
                    </div>
                ) : (
                    messages.map(msg => {
                        const isMe = msg.senderId === currentUserId;

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-medium z-10">
                                    {isMe ? 'You' : msg.senderName} ({msg.senderRole})
                                </span>
                                <div
                                    className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${isMe
                                            ? 'bg-brand-orange text-white rounded-br-none'
                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-end gap-2">
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-brand-orange/50 dark:focus:border-brand-orange/50 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none min-h-[40px] max-h-[120px]"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage(e);
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="h-10 w-10 shrink-0 rounded-full bg-brand-orange text-white grid place-items-center disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors"
                >
                    <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />
                </button>
            </form>
        </div>
    );
}
