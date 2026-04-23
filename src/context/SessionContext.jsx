import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '';
const SessionContext = createContext();

export function SessionProvider({ children }) {
    const [currentSession, setCurrentSession] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        try {
            const response = await axios.get(`${API_BASE}/api/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSessions(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        }
    };

    const fetchCurrentSession = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        try {
            const response = await axios.get(`${API_BASE}/api/sessions/current`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setCurrentSession(response.data.data);
                // Store session token in localStorage for persistence
                localStorage.setItem('sessionToken', response.data.data.session_token);
            }
        } catch (err) {
            console.error('Failed to fetch current session:', err);
        } finally {
            setLoading(false);
        }
    };

    const renameSession = async (sessionId, newName) => {
        const token = localStorage.getItem('authToken');
        try {
            await axios.put(`${API_BASE}/api/sessions/${sessionId}/rename`, 
                { name: newName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchSessions();
            return true;
        } catch (err) {
            console.error('Failed to rename session:', err);
            return false;
        }
    };

    const endSession = async (sessionId) => {
        const token = localStorage.getItem('authToken');
        try {
            await axios.post(`${API_BASE}/api/sessions/${sessionId}/end`, {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchSessions();
            return true;
        } catch (err) {
            console.error('Failed to end session:', err);
            return false;
        }
    };

    useEffect(() => {
        if (localStorage.getItem('authToken')) {
            fetchCurrentSession();
            fetchSessions();
        }
    }, []);

    return (
        <SessionContext.Provider value={{
            currentSession,
            sessions,
            loading,
            refreshSessions: fetchSessions,
            renameSession,
            endSession
        }}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => useContext(SessionContext);