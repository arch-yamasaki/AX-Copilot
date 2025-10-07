import React, { useState, useMemo, useEffect } from 'react';
import { Carte, AsIsStep, ToBeStep, ToolCategory } from '../types';
import CarteCard from './CarteCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrashIcon } from './icons/TrashIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';

const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-3.75-.625m3.75.625V3.375" /></svg>
);
const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
);
const CollectionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
);
const LightBulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-4.5c0-1.355-1.119-2.5-2.5-2.5S8.5 6.9 8.5 8.25c0 2.132 1.29 4.06 2.5 4.5m0 0V12a2.25 2.25 0 0 1-2.25 2.25H9a2.25 2.25 0 0 1-2.25-2.25V9.75M15 12a2.25 2.25 0 0 1-2.25 2.25H12a2.25 2.25 0 0 1-2.25-2.25V9.75M15 12a2.25 2.25 0 0 0 2.25-2.25H15a2.25 2.25 0 0 0-2.25 2.25v.75" /></svg>
);
const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
);
const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
);

interface DashboardViewProps {
  cartes: Carte[];
  onStartNew: () => void;
  onClearData: () => void;
  highlightId: string | null;
}

export const getPriorityStyles = (priority: number) => {
    if (priority >= 80) return { letter: 'A', bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300', fill: '#22c55e' };
    if (priority >= 60) return { letter: 'B', bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-300', fill: '#eab308' };
    if (priority >= 40) return { letter: 'C', bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300', fill: '#f97316' };
    return { letter: 'D', bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300', fill: '#ef4444' };
};

const getToolStyle = (category: ToolCategory) => {
    if (category.startsWith('GAS')) return { color: 'yellow', name: 'GAS' };
    if (category.startsWith('ノーコード')) return { color: 'purple', name: 'ノーコード連携' };
    if (category.startsWith('カスタムAI')) return { color: 'blue', name: 'カスタムAIボット' };
    if (category.startsWith('コード開発')) return { color: 'red', name: 'コード開発' };
    if (category.startsWith('生成AI')) return { color: 'green', name: '生成AIチャット' };
    return { color: 'gray', name: 'その他' };
};

const colorMap: { [key: string]: { bg: string; text: string; dot: string; } } = {
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    red: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    green: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
};

export const ToolIndicator: React.FC<{ category: ToolCategory; }> = ({ category }) => {
    const style = getToolStyle(category);
    const colors = colorMap[style.color];

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
            <span className={`font-semibold text-sm ${colors.text}`}>{style.name}</span>
        </div>
    );
};

const parseImpactText = (text = '') => {
    const html = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-600 font-semibold">$1</strong>');
    return { __html: html };
};

const ProcessFlowView: React.FC<{ carte: Carte; type: 'as-is' | 'to-be' }> = ({ carte, type }) => {
    const isAsIs = type === 'as-is';
    const steps = isAsIs ? carte.asIsSteps : carte.toBeSteps;
    const titleColor = isAsIs ? 'text-gray-700' : 'text-green-700';
    const summaryBg = isAsIs ? 'bg-gray-50 border-gray-200' : 'bg-green-50/60 border-green-200';
    const summaryText = isAsIs ? 'text-gray-500' : 'text-green-800';
    const stepNumColor = isAsIs ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-green-600 bg-green-50 border-green-200';

    return (
        <div>
            <h4 className={`font-semibold ${titleColor} mb-3`}>{isAsIs ? '現状のフロー (As-Is)' : '改善後のフロー (To-Be)'}</h4>
            <p className={`text-sm ${summaryText} mb-4 p-3 rounded-lg border ${summaryBg}`}>
                {isAsIs ? carte.AsIsフロー要約 : carte.ToBeフロー要約}
            </p>
            <div className="relative">
                <div className="absolute left-4 top-4 h-full w-0.5 bg-gray-200"></div>
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={step.工程No} className="relative pl-12">
                            <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${stepNumColor} shadow-sm`}>
                                {step.工程No}
                            </div>
                            <div className="ml-2 pt-1">
                                <div className="flex justify-between items-start">
                                    <p className="font-medium text-gray-800 pr-2">
                                        {isAsIs ? (step as AsIsStep).AsIsステップ名 : (step as ToBeStep).ToBeステップ名}
                                    </p>
                                    {!isAsIs && (
                                        <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${
                                            (step as ToBeStep).実行主体 === '自動化' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {(step as ToBeStep).実行主体}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {isAsIs ? `時間: ${step.時間_分}分 | ツール: ${step.使用ツール}` : `改善のポイント: ${(step as ToBeStep).改善のポイント}`}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CarteDetailModal: React.FC<{ carte: Carte; onClose: () => void; }> = ({ carte, onClose }) => {
    const priority = getPriorityStyles(carte.自動化可能度);
    const monthlySavedHours = ((carte.月間削減時間_分 || 0) / 60).toFixed(1);
    const automationData = [{ value: carte.自動化可能度 }];
    const [isFlowVisible, setIsFlowVisible] = useState(false);
    
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
                className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                
                <header className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-gray-50/80 backdrop-blur-sm rounded-t-2xl z-10">
                    <div>
                        <p className="text-sm font-semibold text-blue-600">{carte.業務カテゴリ}</p>
                        <h2 className="text-2xl font-bold text-gray-900 mt-1">{carte.業務タイトル}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className={`font-bold text-lg px-4 py-1 rounded-full flex items-center ${priority.bg} ${priority.text}`}>
                            優先度: <span className="text-2xl ml-2">{priority.letter}</span>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon className="h-7 w-7" /></button>
                    </div>
                </header>

                <main className="flex-grow overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left Column (3/5) */}
                    <div className="lg:col-span-3 space-y-8">
                        <div>
                             <h3 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-3 flex items-center gap-2"><LightBulbIcon className="h-5 w-5" />推奨ソリューション</h3>
                             <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
                                <div className="mb-2">
                                     <ToolIndicator category={carte.推奨ツールカテゴリ} />
                                </div>
                                <p className="text-gray-600 mt-1">{carte.推奨ソリューション}</p>
                             </div>
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-3 flex items-center gap-2"><ExclamationTriangleIcon className="h-5 w-5" />現状のボトルネック</h3>
                            <div className="space-y-3">
                                {carte.現状のボトルネック.map((item, index) => 
                                    <div key={index} className="p-3 bg-red-50 border-l-4 border-red-400 text-red-800 text-sm rounded-r-lg">
                                        {item}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-3">改善インパクト</h3>
                            <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
                                <p className="text-gray-700 text-base leading-relaxed" dangerouslySetInnerHTML={parseImpactText(carte.改善インパクト)}></p>
                            </div>
                        </div>
                        
                        {carte.高度な提案 && carte.高度な提案.タイトル && (
                             <div>
                                <h3 className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-3 flex items-center gap-2"><SparklesIcon className="h-5 w-5" />高度な提案</h3>
                                <div className="p-5 bg-blue-50/50 border-l-4 border-blue-400 text-blue-900 rounded-r-lg">
                                     <h4 className="font-bold text-blue-800">{carte.高度な提案.タイトル}</h4>
                                     <p className="text-sm mt-1">{carte.高度な提案.説明}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (2/5) */}
                     <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-sm font-bold text-gray-500 tracking-wider uppercase">戦略指標</h3>
                         <div className="p-4 bg-white border rounded-xl shadow-sm">
                            <div className="relative flex justify-center items-center h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[{ value: 100 }]} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={70} fill="#e5e7eb" startAngle={90} endAngle={-270} />
                                        <Pie data={automationData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={70} fill={priority.fill} startAngle={90} endAngle={90 - (carte.自動化可能度 / 100) * 360} cornerRadius={5}>
                                             <Cell fill={priority.fill} />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-xs text-gray-500">自動化可能度</span>
                                    <span className={`text-5xl font-bold ${priority.text}`}>{carte.自動化可能度}<span className="text-2xl">%</span></span>
                                </div>
                            </div>
                             <p className="text-sm text-center text-gray-600 bg-gray-100 p-2 rounded-md mt-2">{carte.自動化可能度根拠}</p>
                         </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
                                <label className="text-xs text-gray-500">属人性</label>
                                <p className="text-3xl font-bold text-gray-800 mt-2">{carte.属人性}</p>
                                <p className="text-xs text-gray-500 mt-1">{carte.属人性根拠}</p>
                            </div>
                             <div className="p-4 bg-white border rounded-xl shadow-sm text-center">
                                <label className="text-xs text-gray-500">月間削減時間</label>
                                <div className="flex items-baseline justify-center gap-1 mt-2">
                                    <p className="text-3xl font-bold text-gray-800">{monthlySavedHours}</p>
                                    <span className="font-medium text-gray-500">時間</span>
                                </div>
                                 <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-1 py-0.5 rounded">{carte.削減時間詳細}</p>
                            </div>
                        </div>
                    </div>
                </main>
                
                <footer className="p-6 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm rounded-b-2xl sticky bottom-0">
                     <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsFlowVisible(!isFlowVisible)}>
                         <h3 className="text-lg font-bold text-gray-800">業務フローの変化</h3>
                         <button className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
                            {isFlowVisible ? '閉じる' : '詳細を見る'}
                            <ChevronDownIcon className={`h-5 w-5 transition-transform ${isFlowVisible ? 'rotate-180' : ''}`} />
                         </button>
                     </div>
                     <AnimatePresence>
                        {isFlowVisible && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0, marginTop: 0 }} 
                                animate={{ height: 'auto', opacity: 1, marginTop: '1.5rem' }} 
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ProcessFlowView carte={carte} type="as-is" />
                                    <ProcessFlowView carte={carte} type="to-be" />
                                </div>
                            </motion.div>
                        )}
                     </AnimatePresence>
                </footer>

            </motion.div>
        </motion.div>
    );
};


const DashboardView: React.FC<DashboardViewProps> = ({ cartes, onStartNew, onClearData, highlightId }) => {
    const [sortBy, setSortBy] = useState<'automation' | 'time' | 'default'>('default');
    const [selectedCarte, setSelectedCarte] = useState<Carte | null>(null);

    useEffect(() => {
        if (highlightId) {
            const carteToHighlight = cartes.find(c => c.業務ID === highlightId);
            if (carteToHighlight) {
                setSelectedCarte(carteToHighlight);
            }
        }
    }, [highlightId, cartes]);

    const sortedCartes = useMemo(() => [...cartes].sort((a, b) => {
        if (sortBy === 'automation') {
            return b.自動化可能度 - a.自動化可能度;
        }
        if (sortBy === 'time') {
            return (b.月間削減時間_分 || 0) - (a.月間削減時間_分 || 0);
        }
        return cartes.indexOf(a) - cartes.indexOf(b);
    }), [cartes, sortBy]);
    
    const { kpiData, priorityData, solutionData } = useMemo(() => {
        const totalWorkload = cartes.reduce((acc, c) => acc + ((c.総時間_分 || 0) * (c.月間回数 || 0)), 0);
        const highPriorityCartes = cartes.filter(c => c.自動化可能度 >= 60); // A and B ranks
        const savingsPotential = highPriorityCartes.reduce((acc, c) => acc + (c.月間削減時間_分 || 0), 0);
        
        const priorityCounts = cartes.reduce((acc, c) => {
            const { letter } = getPriorityStyles(c.自動化可能度);
            acc[letter] = (acc[letter] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const solutionCounts = cartes.reduce((acc, c) => {
            const { name } = getToolStyle(c.推奨ツールカテゴリ);
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            kpiData: {
                count: cartes.length,
                totalWorkloadHours: (totalWorkload / 60).toFixed(1),
                savingsPotentialHours: (savingsPotential / 60).toFixed(1)
            },
            priorityData: [
                { name: 'A', value: priorityCounts['A'] || 0 },
                { name: 'B', value: priorityCounts['B'] || 0 },
                { name: 'C', value: priorityCounts['C'] || 0 },
                { name: 'D', value: priorityCounts['D'] || 0 },
            ],
            solutionData: Object.entries(solutionCounts).map(([name, value]) => ({ name, value })).sort((a,b) => Number(b.value) - Number(a.value))
        };
    }, [cartes]);

    const PRIORITY_COLORS: { [key: string]: string } = { 'A': '#22c55e', 'B': '#eab308', 'C': '#f97316', 'D': '#ef4444' };

    if (cartes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">業務カルテがありません</h2>
                <p className="mb-6 max-w-md">業務棚卸しボットを使って、最初のカルテを作成しましょう。AIがあなたの業務を分析し、改善のヒントを見つけ出します。</p>
                <button
                    onClick={onStartNew}
                    className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                    新しい業務を棚卸しする
                </button>
            </div>
        );
    }
    
    return (
        <>
            <div className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-900">戦略ダッシュボード</h1>
                    <div className="flex items-center space-x-4">
                         <button
                            onClick={onClearData}
                            className="bg-red-50 text-red-600 font-semibold py-2 px-4 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                            title="すべてのカルテを削除します"
                        >
                            <TrashIcon className="h-4 w-4" />
                            <span>全データ削除</span>
                        </button>
                        <button
                            onClick={onStartNew}
                            className="bg-blue-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-sm flex items-center gap-2"
                        >
                            <span className="text-xl">+</span><span>新規棚卸し</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
                        <div className="bg-blue-100 text-blue-600 p-3 rounded-lg"><CollectionIcon className="h-6 w-6"/></div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">棚卸し済み業務数</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{kpiData.count}<span className="text-base font-medium text-gray-500"> 件</span></p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
                        <div className="bg-gray-100 text-gray-600 p-3 rounded-lg"><ClockIcon className="h-6 w-6"/></div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">月間総工数</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{kpiData.totalWorkloadHours}<span className="text-base font-medium text-gray-500"> 時間</span></p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-green-300 shadow-sm flex items-start gap-4 bg-green-50/50">
                        <div className="bg-green-100 text-green-600 p-3 rounded-lg"><TrendingUpIcon className="h-6 w-6"/></div>
                        <div>
                            <h3 className="text-sm font-medium text-green-700">削減ポテンシャル (A, B)</h3>
                            <p className="text-3xl font-bold text-green-600 mt-1">{kpiData.savingsPotentialHours}<span className="text-base font-medium text-green-500"> 時間</span></p>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4">優先度別サマリー</h3>
                        <div className="space-y-3">
                            {priorityData.map(entry => (
                                <div key={entry.name}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-semibold" style={{ color: PRIORITY_COLORS[entry.name] }}>ランク {entry.name}</span>
                                        <span className="text-sm font-medium text-gray-500">{entry.value}件</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="h-2.5 rounded-full" style={{ width: `${(entry.value / cartes.length) * 100}%`, backgroundColor: PRIORITY_COLORS[entry.name] }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4">ソリューション別サマリー</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={solutionData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={120} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} formatter={(value) => `${value}件`} />
                                <Bar dataKey="value" fill="#3b82f6" barSize={20} radius={[0, 10, 10, 0]}>
                                    {solutionData.map((entry, index) => <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={1 - (index * 0.1)} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                     <h2 className="text-2xl font-bold text-gray-900">業務カルテ一覧</h2>
                    <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">並び替え:</span>
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-white border border-gray-300 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-auto p-2"
                        >
                            <option value="default">作成順</option>
                            <option value="automation">自動化ポテンシャル</option>
                            <option value="time">月間削減時間</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sortedCartes.map(carte => (
                        <CarteCard 
                            key={carte.業務ID} 
                            carte={carte}
                            onClick={() => setSelectedCarte(carte)}
                        />
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selectedCarte && (
                    <CarteDetailModal 
                        carte={selectedCarte} 
                        onClose={() => setSelectedCarte(null)} 
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default DashboardView;