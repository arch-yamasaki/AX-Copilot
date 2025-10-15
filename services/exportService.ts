import { Carte, ToolCategory } from '../types';

export type UserMeta = {
  uid: string;
  fullname: string;
  department: string;
  email: string;
};

const TOOL_CATEGORY_NAME: Record<ToolCategory, string> = {
  '生成AIチャット': '生成AIチャット',
  'ノーコード開発': 'ノーコード開発',
  'カスタムAIチャット': 'カスタムAIチャット',
  GAS: 'GAS',
  'システム開発': 'システム開発',
  'その他': 'その他',
};

export const escapeCsv = (value: string): string => `"${String(value).replaceAll('"', '""')}"`;

const formatAsIsSteps = (carte: Carte): string => {
  if (!carte.asIsSteps.length) return '';
  return carte.asIsSteps
    .map(step => `${step.stepNo}: ${step.asIsStepName} (${step.minutes}分)`) 
    .join(' / ');
};

const formatToBeSteps = (carte: Carte): string => {
  if (!carte.toBeSteps.length) return '';
  return carte.toBeSteps
    .map(step => {
      const mode = step.executorType === 'automated' ? '自動化' : '手動';
      return `${step.stepNo}: ${step.toBeStepName} [${mode}] (${step.minutes}分)`;
    })
    .join(' / ');
};

export const cartesToCsvRows = (cartes: Carte[], user: UserMeta): string[] => {
  const header = [
    'ユーザーID',
    '氏名',
    '部署名',
    'メールアドレス',
    '業務ID',
    '業務名',
    'カテゴリ',
    '実施頻度',
    '月間回数',
    '1回あたり総時間(分)',
    '工程数',
    '主要ツール',
    '現状のボトルネック',
    '主要データ',
    'データ形式',
    'データ状態',
    'データ保存場所',
    'API連携',
    'As-Is要約',
    'As-Is工程',
    'To-Be要約',
    'To-Be工程',
    '推奨ツールカテゴリ',
    '推奨ソリューション',
    '改善インパクト',
    '自動化可能度(%)',
    '自動化可能度の根拠',
    '属人性',
    '属人性の根拠',
    '備考',
    '月間削減時間(分)',
    '実施人数',
    '月間総工数(分)',
    '推定開発コスト(JPY)',
    '高度な提案タイトル',
    '高度な提案概要',
  ];

  const rows = cartes.map(carte => {
    const fallback = carte as any;
    const recommendedSolution = carte.recommendedSolution ?? fallback['推奨ソリューション'] ?? '';
    const improvementImpact = carte.improvementImpact ?? fallback['改善インパクト'] ?? '';
    const asIsSummary = carte.asIsSummary ?? fallback['AsIsフロー要約'] ?? '';
    const toBeSummary = carte.toBeSummary ?? fallback['ToBeフロー要約'] ?? '';
    const automationScoreRationale = carte.automationScoreRationale ?? fallback['自動化可能度根拠'] ?? '';
    const humanDependency = (carte.humanDependency ?? fallback['属人性']) ?? '';
    const humanDependencyRationale = carte.humanDependencyRationale ?? fallback['属人性根拠'] ?? '';
    const notes = carte.notes ?? fallback['備考'] ?? '';
    const advancedProposal = carte.advancedProposal ?? fallback['高度な提案'];
    const advancedTitle = advancedProposal?.title ?? advancedProposal?.タイトル ?? '';
    const advancedDescription = advancedProposal?.description ?? advancedProposal?.説明 ?? '';
    const totalWorkload = carte.totalWorkloadMinutesPerMonth ?? (carte.totalMinutes * carte.monthlyCount * (carte.numberOfPeople ?? 1));

    const toolCategoryName = carte.recommendedToolCategory ? TOOL_CATEGORY_NAME[carte.recommendedToolCategory] : TOOL_CATEGORY_NAME['その他'];

    const values = [
      // User columns first
      user.uid,
      user.fullname,
      user.department,
      user.email,
      carte.workId,
      carte.title,
      carte.category,
      carte.frequency,
      `${carte.monthlyCount ?? ''}`,
      `${carte.totalMinutes ?? ''}`,
      `${carte.numSteps ?? ''}`,
      carte.primaryTool,
      (carte.currentBottlenecks ?? []).join(' / '),
      carte.primaryData,
      carte.dataFormat,
      carte.dataState,
      carte.dataStorage,
      carte.apiIntegration,
      asIsSummary,
      formatAsIsSteps(carte),
      toBeSummary,
      formatToBeSteps(carte),
      toolCategoryName,
      recommendedSolution,
      improvementImpact.replace(/\r?\n/g, ' '),
      `${carte.automationScore ?? ''}`,
      automationScoreRationale,
      humanDependency,
      humanDependencyRationale,
      notes,
      `${carte.monthlySavedMinutes ?? ''}`,
      `${carte.numberOfPeople ?? ''}`,
      `${totalWorkload ?? ''}`,
      `${carte.estimatedInternalCostJPY ?? ''}`,
      advancedTitle,
      advancedDescription,
    ];

    return values.map(value => escapeCsv(value ?? '')).join(',');
  });

  return [header.join(','), ...rows];
};

export const buildCsvContent = (rows: string[], withBom = true): string => {
  const content = rows.join('\n');
  return withBom ? '\ufeff' + content : content;
};

export const buildDefaultFileName = (prefix = 'ax-copilot-cartes'): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${prefix}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.csv`;
};

export const downloadCsv = (csvContent: string, fileName: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

