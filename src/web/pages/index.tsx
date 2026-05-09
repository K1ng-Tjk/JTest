import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, BookOpen, Settings } from "lucide-react";

function Index() {
	const [, setLocation] = useLocation();

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
			{/* Header */}
			<header className="border-b bg-white shadow-sm">
				<div className="max-w-6xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-4xl font-bold text-slate-900">JTest</h1>
							<p className="text-slate-600 mt-1">Тренажёр для тестирования</p>
						</div>
						<Button variant="outline" onClick={() => setLocation("/settings")}>
							<Settings className="w-4 h-4 mr-2" />
							Настройки
						</Button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-6xl mx-auto px-6 py-12">
				<div className="grid md:grid-cols-2 gap-6">
					{/* Upload Test Card */}
					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Upload className="w-5 h-5 text-blue-600" />
								Загрузить тест
							</CardTitle>
							<CardDescription>Загрузите файл с вопросами и ответами</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
									<Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
									<p className="text-sm text-slate-600 mb-1">Перетащите файл сюда</p>
									<p className="text-xs text-slate-400">или нажмите для выбора</p>
									<input type="file" className="hidden" accept=".txt,.pdf,.doc,.docx" />
								</div>
								<div className="space-y-2">
									<p className="text-sm font-medium text-slate-700">Поддерживаемые форматы:</p>
									<ul className="text-sm text-slate-600 space-y-1">
										<li>• TXT файлы</li>
										<li>• PDF документы</li>
										<li>• Word документы</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Recent Tests Card */}
					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BookOpen className="w-5 h-5 text-green-600" />
								Недавние тесты
							</CardTitle>
							<CardDescription>Ваши сохранённые тесты</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:border-green-500 transition-colors">
									<p className="font-medium text-slate-900">Математика 10 класс</p>
									<p className="text-xs text-slate-500 mt-1">25 вопросов • 2 часа назад</p>
								</div>
								<div className="p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:border-green-500 transition-colors">
									<p className="font-medium text-slate-900">История Украины</p>
									<p className="text-xs text-slate-500 mt-1">15 вопросов • 1 день назад</p>
								</div>
								<div className="p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:border-green-500 transition-colors">
									<p className="font-medium text-slate-900">Английский язык A2</p>
									<p className="text-xs text-slate-500 mt-1">30 вопросов • 3 дня назад</p>
								</div>
							</div>
							<Button variant="outline" className="w-full mt-4">Смотреть всё</Button>
						</CardContent>
					</Card>
				</div>

				{/* Features Section */}
				<section className="mt-12">
					<h2 className="text-2xl font-bold text-slate-900 mb-6">Возможности</h2>
					<div className="grid md:grid-cols-3 gap-4">
						<div className="p-4 rounded-lg bg-white border border-slate-200">
							<h3 className="font-semibold text-slate-900 mb-2">📝 Быстрое создание</h3>
							<p className="text-sm text-slate-600">Загрузите текстовый файл и начните тест за секунды</p>
						</div>
						<div className="p-4 rounded-lg bg-white border border-slate-200">
							<h3 className="font-semibold text-slate-900 mb-2">📊 Статистика</h3>
							<p className="text-sm text-slate-600">Отслеживайте прогресс и анализируйте ошибки</p>
						</div>
						<div className="p-4 rounded-lg bg-white border border-slate-200">
							<h3 className="font-semibold text-slate-900 mb-2">⚙️ Настройка</h3>
							<p className="text-sm text-slate-600">Конфигурируйте режимы тестирования под себя</p>
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section className="mt-12 p-8 bg-white rounded-lg border border-slate-200 text-center">
					<h2 className="text-2xl font-bold text-slate-900 mb-3">Готовы начать?</h2>
					<p className="text-slate-600 mb-6 max-w-2xl mx-auto">
						Создайте свой первый тест прямо сейчас. JTest поддерживает множество форматов и поможет вам готовиться эффективнее.
					</p>
					<Button size="lg" onClick={() => setLocation("/create")}>
						Создать новый тест
					</Button>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t bg-white mt-16">
				<div className="max-w-6xl mx-auto px-6 py-6">
					<p className="text-sm text-slate-600 text-center">
						© 2026 JTest. Всё права защищены. | PWA тренажёр для тестирования
					</p>
				</div>
			</footer>
		</div>
	);
}

export default Index;
