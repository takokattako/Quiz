"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Supabase クライアント（クライアント環境では NEXT_PUBLIC_ プレフィックスを使用）
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function QuizList() {
    const [selectedCategory, setSelectedCategory] = useState("");
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState({});
    const [expandedHints, setExpandedHints] = useState({});
    const [selectedOptions, setSelectedOptions] = useState({}); // quizId -> index of clicked option

    useEffect(() => {
        async function loadQuizzes() {
            setLoading(true);
            setError(null);
            try {
                const { data, error: sbError } = await supabase
                    .from("question")
                    .select("id, question_text, answer, hint, category, choice1, choice2, choice3, choice4, explanation")
                    .order("id", { ascending: true });

                if (sbError) {
                    setError(sbError.message);
                    setQuizzes([]);
                } else if (data) {
                    setQuizzes(data);
                }
            } catch (e) {
                setError(String(e));
                setQuizzes([]);
            } finally {
                setLoading(false);
            }
        }

        loadQuizzes();
    }, []);

    // カテゴリフィルタリング
    const filteredQuizzes = selectedCategory
        ? quizzes.filter((quiz) => quiz.category === selectedCategory)
        : quizzes;

    const toggleQuiz = (quizId) => {
        setExpanded((prev) => ({ ...prev, [quizId]: !prev[quizId] }));
    };

    const toggleHint = (quizId) => {
        setExpandedHints((prev) => ({ ...prev, [quizId]: !prev[quizId] }));
    };

    const handleOptionClick = (quizId, index, optionText) => {
        // ignore if already answered
        setSelectedOptions((prev) => {
            if (prev[quizId] !== undefined) return prev;
            return { ...prev, [quizId]: { index, optionText } };
        });
    };

    return (
        <div>
            {/* フィルター */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            カテゴリ
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">すべて</option>
                            <option value="英語">英語</option>
                            <option value="数学">数学</option>
                            <option value="国語">国語</option>
                            <option value="理科">理科</option>
                            <option value="社会">社会</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ローディング・エラー表示 */}
            {loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500">読み込み中…</p>
                </div>
            ) : error ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                    <p className="text-red-600">エラー: {error}</p>
                </div>
            ) : filteredQuizzes.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        クイズがありません
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        新しいクイズを追加して始めましょう。
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/create"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            クイズを追加
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredQuizzes.map((quiz) => (
                        <div
                            key={quiz.id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="mb-4">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                        {quiz.category}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 whitespace-pre-wrap">
                                    {quiz.question_text}
                                </h3>

                                {/* 選択肢（縦一列で表示） */}
                                <div className="mt-4">
                                    {(() => {
                                        const choices = [];
                                        if (quiz.choice1 !== undefined) choices.push(quiz.choice1);
                                        if (quiz.choice2 !== undefined) choices.push(quiz.choice2);
                                        if (quiz.choice3 !== undefined) choices.push(quiz.choice3);
                                        if (quiz.choice4 !== undefined) choices.push(quiz.choice4);
                                        // fallback: if no separate choices, try to parse JSON from hint
                                        if (choices.length === 0) {
                                            try {
                                                const parsed = quiz.hint ? JSON.parse(quiz.hint) : null;
                                                if (Array.isArray(parsed) && parsed.length >= 1) choices.push(...parsed.slice(0, 4));
                                            } catch (e) {}
                                        }
                                        if (choices.length === 0) choices.push(quiz.answer || "");

                                        return choices.map((choice, idx) => {
                                            const selected = selectedOptions[quiz.id];
                                            const isClicked = selected && selected.index === idx;
                                            const isCorrect = quiz.answer !== undefined && String(choice) === String(quiz.answer);
                                            const baseClass = "w-full text-left border rounded-lg p-3 mb-2";
                                            const defaultStyle = "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700";
                                            let style = defaultStyle;

                                            if (selected) {
                                                if (isClicked) {
                                                    style = isCorrect
                                                        ? "border-green-500 bg-green-100 text-green-900 dark:bg-green-900/20"
                                                        : "border-red-500 bg-red-100 text-red-900 dark:bg-red-900/20";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionClick(quiz.id, idx, choice)}
                                                    disabled={selectedOptions[quiz.id] !== undefined}
                                                    className={`${baseClass} ${style} focus:outline-none`}
                                                >
                                                    <div className="flex items-center">
                                                        <div className="mr-3 text-sm font-medium">{String.fromCharCode(65 + idx)}.</div>
                                                        <div className="text-sm font-medium break-words">{choice}</div>
                                                    </div>
                                                </button>
                                            );
                                        });
                                    })()}

                                    {/* 解説 */}
                                    {selectedOptions[quiz.id] && (
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 mt-2">
                                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">解説</div>
                                            <div className="text-gray-900 dark:text-white text-sm">
                                                {quiz.explanation || quiz.hint || "解説は登録されていません。"}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
