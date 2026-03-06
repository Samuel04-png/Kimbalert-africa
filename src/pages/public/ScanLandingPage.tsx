import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, MapPin, AlertTriangle, Shield, Send, CheckCircle } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { childrenSeed, guardiansSeed, reportsSeed } from '../../mockData';

interface ScanChild {
    id: string;
    name: string;
    photoUrl?: string;
    dateOfBirth: string;
    gender: string;
    guardianId: string;
    qrBraceletId: string;
}

interface ScanGuardian {
    id: string;
    fullName: string;
    phone: string;
}

export default function ScanLandingPage() {
    const { braceletId } = useParams<{ braceletId: string }>();
    const [child, setChild] = useState<ScanChild | null>(null);
    const [guardian, setGuardian] = useState<ScanGuardian | null>(null);
    const [isMissing, setIsMissing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Sighting form
    const [showSighting, setShowSighting] = useState(false);
    const [sightingLocation, setSightingLocation] = useState('');
    const [sightingDescription, setSightingDescription] = useState('');
    const [sightingSubmitted, setSightingSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!braceletId) {
            setNotFound(true);
            setLoading(false);
            return;
        }

        const lookup = async () => {
            try {
                if (isFirebaseConfigured && db) {
                    // Query Firestore for the child
                    const childSnap = await getDocs(
                        query(collection(db, 'children'), where('qrBraceletId', '==', braceletId), limit(1))
                    );

                    if (childSnap.empty) {
                        setNotFound(true);
                        setLoading(false);
                        return;
                    }

                    const childData = childSnap.docs[0].data() as ScanChild;
                    childData.id = childSnap.docs[0].id;
                    setChild(childData);

                    // Get guardian info
                    const guardianSnap = await getDocs(
                        query(collection(db, 'guardians'), where('__name__', '==', childData.guardianId), limit(1))
                    );
                    if (!guardianSnap.empty) {
                        const gData = guardianSnap.docs[0].data() as ScanGuardian;
                        gData.id = guardianSnap.docs[0].id;
                        setGuardian(gData);
                    }

                    // Check if child is reported missing
                    const reportSnap = await getDocs(
                        query(collection(db, 'reports'), where('childId', '==', childData.id), where('status', '==', 'active'), limit(1))
                    );
                    setIsMissing(!reportSnap.empty);

                    // Log the scan event
                    await addDoc(collection(db, 'scanEvents'), {
                        braceletId,
                        childId: childData.id,
                        scannedAt: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                    }).catch(() => { });
                } else {
                    // Offline/demo fallback
                    const mockChild = childrenSeed.find((c) => c.qrBraceletId === braceletId);
                    if (!mockChild) {
                        setNotFound(true);
                        setLoading(false);
                        return;
                    }
                    setChild(mockChild as unknown as ScanChild);
                    const mockGuardian = guardiansSeed.find((g) => g.id === mockChild.guardianId);
                    if (mockGuardian) setGuardian(mockGuardian as unknown as ScanGuardian);
                    const mockReport = reportsSeed.find((r) => r.childId === mockChild.id && r.status === 'active');
                    setIsMissing(Boolean(mockReport));
                }
            } catch (err) {
                console.error('Scan lookup error:', err);
                setNotFound(true);
            }
            setLoading(false);
        };

        void lookup();
    }, [braceletId]);

    const submitSighting = async () => {
        if (!sightingLocation.trim() || !child) return;
        setSubmitting(true);

        try {
            if (isFirebaseConfigured && db) {
                await addDoc(collection(db, 'tips'), {
                    reportId: '',
                    childId: child.id,
                    location: sightingLocation,
                    description: sightingDescription || 'Bracelet scanned — child sighted at this location.',
                    status: 'new',
                    createdAt: new Date().toISOString(),
                    source: 'qr-scan',
                });
            }
            setSightingSubmitted(true);
        } catch (err) {
            console.error('Sighting submit error:', err);
        }
        setSubmitting(false);
    };

    const childAge = child?.dateOfBirth
        ? Math.max(0, Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 3600000)))
        : null;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#1a2840] flex items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 rounded-full border-4 border-brand-orange border-t-transparent animate-spin" />
                    <p className="mt-4 text-sm text-slate-300">Looking up bracelet...</p>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#1a2840] flex items-center justify-center px-4">
                <div className="max-w-sm w-full text-center bg-[#111a2b] border border-slate-700 rounded-2xl p-8 shadow-2xl">
                    <Shield className="mx-auto h-16 w-16 text-slate-500" />
                    <h1 className="mt-4 text-2xl font-bold text-white">Bracelet Not Found</h1>
                    <p className="mt-2 text-sm text-slate-400">
                        The bracelet code <span className="font-mono text-brand-orange">{braceletId}</span> is not registered in our system.
                    </p>
                    <a href="/" className="mt-6 inline-block rounded-full bg-brand-orange px-6 py-2.5 text-sm font-bold text-white">
                        Go to KimbAlert
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#1a2840] px-4 py-6">
            <div className="mx-auto max-w-md">
                {/* Header */}
                <div className="text-center mb-6">
                    <img
                        src={`${import.meta.env.BASE_URL}Kimbalert-africa_logo.png`}
                        alt="KimbAlert Africa"
                        className="mx-auto h-12 w-12 rounded-xl bg-white p-1 shadow-lg"
                    />
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">KimbAlert Africa</p>
                    <p className="text-[10px] text-slate-500">Child Safety Verification</p>
                </div>

                {/* Missing Alert Banner */}
                {isMissing && (
                    <div className="mb-4 rounded-xl border-2 border-red-500 bg-red-500/15 p-4 text-center animate-pulse">
                        <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
                        <p className="mt-2 text-lg font-bold text-red-300">⚠️ THIS CHILD IS REPORTED MISSING</p>
                        <p className="mt-1 text-xs text-red-400">
                            If you have found this child, please contact the guardian immediately or report a sighting below.
                        </p>
                    </div>
                )}

                {/* Child Info Card */}
                <div className="rounded-2xl border border-slate-700 bg-[#111a2b] p-5 shadow-2xl">
                    <div className="flex items-center gap-4">
                        {child?.photoUrl ? (
                            <img
                                src={child.photoUrl}
                                alt={child.name}
                                className="h-20 w-20 rounded-xl object-cover border-2 border-brand-orange/30 shadow-lg"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-xl bg-brand-orange/20 flex items-center justify-center text-3xl font-bold text-brand-orange border-2 border-brand-orange/30">
                                {child?.name?.charAt(0) || '?'}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-white">{child?.name}</h1>
                            {childAge !== null && (
                                <p className="text-sm text-slate-400">{childAge} years old • {child?.gender}</p>
                            )}
                            <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isMissing
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                {isMissing ? '🚨 Missing' : '✅ Safe'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-700 bg-[#0b1220] p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Bracelet ID</p>
                        <p className="font-mono text-sm font-bold text-brand-orange">{braceletId}</p>
                    </div>

                    {guardian && (
                        <div className="mt-3 rounded-xl border border-slate-700 bg-[#0b1220] p-3">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400">Registered Guardian</p>
                            <p className="text-sm font-semibold text-white">{guardian.fullName}</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                    {guardian?.phone && (
                        <a
                            href={`tel:${guardian.phone}`}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-500 transition-colors"
                        >
                            <Phone className="h-4 w-4" />
                            Call Guardian
                        </a>
                    )}

                    <button
                        onClick={() => setShowSighting(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-3.5 text-sm font-bold text-white shadow-lg hover:bg-orange-500 transition-colors"
                    >
                        <MapPin className="h-4 w-4" />
                        Report Sighting
                    </button>

                    <a
                        href="tel:10111"
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3.5 text-sm font-bold text-red-300 hover:bg-red-500/20 transition-colors"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Call Emergency (10111)
                    </a>
                </div>

                {/* Sighting Form */}
                {showSighting && !sightingSubmitted && (
                    <div className="mt-4 rounded-2xl border border-slate-700 bg-[#111a2b] p-5 shadow-2xl">
                        <h2 className="text-lg font-bold text-white mb-3">Report a Sighting</h2>
                        <p className="text-xs text-slate-400 mb-4">
                            Help us locate this child. Tell us where you've seen them.
                        </p>

                        <label className="block mb-3">
                            <span className="text-xs font-semibold text-slate-300 block mb-1">Location *</span>
                            <input
                                type="text"
                                value={sightingLocation}
                                onChange={(e) => setSightingLocation(e.target.value)}
                                placeholder="e.g. Corner of Main St & 5th Ave, Lusaka"
                                className="w-full rounded-lg border border-slate-600 bg-[#0b1220] px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                            />
                        </label>

                        <label className="block mb-4">
                            <span className="text-xs font-semibold text-slate-300 block mb-1">Additional details (optional)</span>
                            <textarea
                                rows={3}
                                value={sightingDescription}
                                onChange={(e) => setSightingDescription(e.target.value)}
                                placeholder="What was the child wearing? Were they alone? Any other details..."
                                className="w-full rounded-lg border border-slate-600 bg-[#0b1220] px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                            />
                        </label>

                        <button
                            onClick={() => void submitSighting()}
                            disabled={submitting || !sightingLocation.trim()}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            {submitting ? 'Sending...' : 'Submit Sighting Report'}
                        </button>
                    </div>
                )}

                {sightingSubmitted && (
                    <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
                        <CheckCircle className="mx-auto h-10 w-10 text-emerald-400" />
                        <p className="mt-2 text-lg font-bold text-emerald-300">Thank You!</p>
                        <p className="mt-1 text-xs text-emerald-400">
                            Your sighting report has been sent to the KimbAlert Command Center. The guardian and task force have been notified.
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-500">
                        Powered by KimbAlert Africa • Protecting children across the continent
                    </p>
                    <a href="/" className="mt-1 text-[10px] text-brand-orange hover:underline">
                        Learn more about KimbAlert
                    </a>
                </div>
            </div>
        </div>
    );
}
