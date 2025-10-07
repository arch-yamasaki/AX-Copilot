import React from 'react';
import { Carte, ToolCategory } from '../types';
import { motion } from 'framer-motion';
import { ToolIndicator, getPriorityStyles } from './DashboardView';

interface CarteCardProps {
    carte: Carte;
    onClick: () => void;
}

const CarteCard: React.FC<CarteCardProps> = ({ carte, onClick }) => {
    const priority = getPriorityStyles(carte.自動化可能度);
    const monthlySavedTime = carte.月間削減時間_分 || 0;

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
                        <p className="text-sm text-blue-600 font-semibold">{carte.業務カテゴリ}</p>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">{carte.業務タイトル}</h3>
                    </div>
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl ${priority.bg} ${priority.text} border-2 ${priority.border}`}>
                        {priority.letter}
                    </div>
                </div>

                <div className="my-6 grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-500">自動化ポテンシャル</p>
                        <p className={`text-3xl font-bold ${priority.text}`}>{carte.自動化可能度}<span className="text-lg">%</span></p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">月間削減時間</p>
                        <p className="text-3xl font-bold text-gray-800">{(monthlySavedTime / 60).toFixed(1)}<span className="text-lg">h</span></p>
                    </div>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">主要ツール</span>
                        <span className="text-gray-800 font-medium">{carte.主要ツール}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">データ状態</span>
                        <span className="text-gray-800 font-medium">{carte.データ状態}</span>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50/70 px-6 py-4 rounded-b-xl border-t border-gray-200 mt-auto">
                 <h4 className="text-xs font-semibold text-gray-500 mb-2 tracking-wider uppercase">推奨ソリューション</h4>
                 <ToolIndicator category={carte.推奨ツールカテゴリ} />
            </div>
        </motion.div>
    );
};

export default CarteCard;