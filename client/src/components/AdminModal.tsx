import React, { useState } from 'react';
import { X, Save, Lock, Server, Key, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [config, setConfig] = useState({
        default_provider: 'openrouter',
        default_model: 'google/gemini-2.0-flash-exp:free',
        default_api_key: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple client-side check to prevent annoyance, 
        // real security is on the server endpoint which requires the header.
        // Ideally we just try to fetch config or something, but for now we'll just gate the UI.
        // The server expects "satoshi123" by default as per my backend code.
        if (password) {
            setIsAuthenticated(true);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': password
                },
                body: JSON.stringify(config)
            });

            if (!res.ok) {
                throw new Error('Unauthorized or Failed');
            }

            setSuccess('Configuration System Updated.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Access Denied: Invalid Credentials');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-surface border border-neutral-800 w-full max-w-md p-6 shadow-2xl relative"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                    >
                        <X size={20} />
                    </button>

                    <h2 className="text-xl font-mono text-primary mb-6 flex items-center gap-2">
                        <Server size={20} />
                        SYSTEM_OVERRIDE
                    </h2>

                    {!isAuthenticated ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-neutral-500 mb-1">ACCESS_CODE</label>
                                <div className="flex items-center bg-black border border-neutral-800 px-3 py-2">
                                    <Lock size={16} className="text-neutral-500 mr-2" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-transparent border-none outline-none text-white w-full font-mono"
                                        placeholder="Enter passphrase..."
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-neutral-900 border border-neutral-700 text-neutral-300 py-2 font-mono hover:bg-neutral-800 hover:text-primary transition-colors"
                            >
                                AUTHENTICATE
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-neutral-500 mb-1">PROVIDER_GATEWAY</label>
                                <div className="flex items-center bg-black border border-neutral-800 px-3 py-2">
                                    <Server size={16} className="text-neutral-500 mr-2" />
                                    <select
                                        value={config.default_provider}
                                        onChange={(e) => setConfig({ ...config, default_provider: e.target.value })}
                                        className="bg-transparent border-none outline-none text-white w-full font-mono"
                                    >
                                        <option value="openrouter">OpenRouter</option>
                                        <option value="gemini_direct">Google Gemini</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-neutral-500 mb-1">NEURAL_MODEL</label>
                                <div className="flex items-center bg-black border border-neutral-800 px-3 py-2">
                                    <Cpu size={16} className="text-neutral-500 mr-2" />
                                    <input
                                        type="text"
                                        value={config.default_model}
                                        onChange={(e) => setConfig({ ...config, default_model: e.target.value })}
                                        className="bg-transparent border-none outline-none text-white w-full font-mono"
                                        placeholder="e.g. google/gemini-pro"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-neutral-500 mb-1">API_SECRET</label>
                                <div className="flex items-center bg-black border border-neutral-800 px-3 py-2">
                                    <Key size={16} className="text-neutral-500 mr-2" />
                                    <input
                                        type="password"
                                        value={config.default_api_key}
                                        onChange={(e) => setConfig({ ...config, default_api_key: e.target.value })}
                                        className="bg-transparent border-none outline-none text-white w-full font-mono"
                                        placeholder="sk-..."
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-xs font-mono">{error}</p>}
                            {success && <p className="text-secondary text-xs font-mono">{success}</p>}

                            <button
                                onClick={handleSave}
                                className="w-full bg-primary/10 border border-primary/30 text-primary py-2 font-mono hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={16} />
                                COMMIT_CHANGES
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
