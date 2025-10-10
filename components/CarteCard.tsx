import React from 'react';
import { Carte, ToolCategory } from '../types';
import { motion } from 'framer-motion';
import { ToolIndicator, getPriorityStyles } from './DashboardView';

interface CarteCardProps {
    carte: Carte;
    onClick: () => void;
    onDelete?: () => void;
}

const CarteCard: React.FC<CarteCardProps> = ({ carte, onClick, onDelete }) => {
    const priority = getPriorityStyles(carte.automationScore);
    const monthlySavedTime = carte.monthlySavedMinutes || 0;
    // monthlySavedMinutes は組織全体ベースで再計算済み

    return (
        <motion.div
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-md border border-gray-200 cursor-pointer flex flex-col h-full"
            onClick={onClick}
        >
            <div className="p-6 flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-blue-600 font-semibold">{carte.category}</p>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">{carte.title}</h3>
                    </div>
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl ${priority.bg} ${priority.text} border-2 ${priority.border}`}>
                        {priority.letter}
                    </div>
                </div>

                <div className="my-6 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-500">総業務時間</p>
                        <p className={`text-3xl font-bold ${priority.text}`}>{Math.round(carte.totalWorkloadMinutesPerMonth / 60 * 10) / 10}<span className="text-lg">h</span></p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">自動化可能度</p>
                        <p className={`text-3xl font-bold ${priority.text}`}>{carte.automationScore}<span className="text-lg">%</span></p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">月間削減時間</p>
                        <p className="text-3xl font-bold text-gray-800">{(monthlySavedTime / 60).toFixed(1)}<span className="text-lg">h</span></p>
                    </div>
                </div>

                {/* 基本メトリクス行 */}
                <div className="my-2 text-sm text-gray-600 flex flex-col gap-2">
                    <div>
                        <span className="text-gray-500">1回あたり業務時間：</span>
                        <span className="text-gray-800 font-medium">{carte.totalMinutes}分</span>
                    </div>
                    <div>
                        <span className="text-gray-500">月間業務回数：</span>
                        <span className="text-gray-800 font-medium">{carte.monthlyCount}回</span>
                    </div>
                    <div>
                        <span className="text-gray-500">対象人数：</span>
                        <span className="text-gray-800 font-medium">{carte.numberOfPeople ?? 1}人</span>
                    </div>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">主要ツール</span>
                        <span className="text-gray-800 font-medium">{carte.primaryTool}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">データ状態</span>
                        <span className="text-gray-800 font-medium">{carte.dataState}</span>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50/70 px-6 py-4 rounded-b-xl border-t border-gray-200 mt-auto">
                 <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-2 tracking-wider uppercase">推奨ソリューション</h4>
                        <ToolIndicator category={carte.recommendedToolCategory} />
                    </div>
                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="text-red-600 hover:text-red-700 text-sm font-semibold"
                            title="このカルテを削除"
                        >
                            削除
                        </button>
                    )}
                 </div>
            </div>
        </motion.div>
    );
};

export default CarteCard;