'use client';

import { useQuery } from '@tanstack/react-query';
import { aiAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Lightbulb, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function InsightsPage() {
  const [generatingDaily, setGeneratingDaily] = useState(false);
  const [generatingWeekly, setGeneratingWeekly] = useState(false);

  // Fetch AI insights
  const { data: productivityInsights, isLoading: productivityLoading } = useQuery({
    queryKey: ['productivity-insights'],
    queryFn: () => aiAPI.getProductivityInsights(7),
    retry: false,
  });

  const { data: weeklyReport, isLoading: weeklyLoading } = useQuery({
    queryKey: ['weekly-report'],
    queryFn: () => aiAPI.getWeeklyReport(),
    retry: false,
  });

  const handleGenerateDaily = async () => {
    setGeneratingDaily(true);
    try {
      await aiAPI.getDailySummary();
      // Refresh the page or refetch data
      window.location.reload();
    } catch (error) {
      console.error('Failed to generate daily summary', error);
    } finally {
      setGeneratingDaily(false);
    }
  };

  const handleGenerateWeekly = async () => {
    setGeneratingWeekly(true);
    try {
      await aiAPI.getWeeklyReport();
      window.location.reload();
    } catch (error) {
      console.error('Failed to generate weekly report', error);
    } finally {
      setGeneratingWeekly(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          AI Insights
        </h1>
        <p className="text-slate-500 mt-2">
          Get personalized productivity insights powered by AI
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Brain className="h-4 w-4" />
        <AlertDescription>
          AI insights are generated using Google Gemini AI. Make sure your backend has a valid GEMINI_API_KEY configured.
        </AlertDescription>
      </Alert>

      {/* Productivity Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Productivity Insights
              </CardTitle>
              <p className="text-sm text-slate-500 mt-2">Last 7 days</p>
            </div>
            <Button 
              onClick={handleGenerateDaily} 
              disabled={generatingDaily}
              variant="outline"
            >
              {generatingDaily ? 'Generating...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {productivityLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : productivityInsights ? (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
                    {Math.round(productivityInsights.productivity_score)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      Productivity Score
                    </p>
                    <p className="text-sm text-slate-500">Out of 100</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {productivityInsights.insights}
                </p>
              </div>

              {/* Time Breakdown */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-500">Total Time</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {Math.round(productivityInsights.time_spent.total_minutes / 60)}h
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-sm text-green-600">Productive</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-400">
                    {Math.round(productivityInsights.time_spent.productive_minutes / 60)}h
                  </p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <p className="text-sm text-orange-600">Social</p>
                  <p className="text-xl font-bold text-orange-700 dark:text-orange-400">
                    {Math.round(productivityInsights.time_spent.social_minutes / 60)}h
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No insights available yet. Generate your first insights!</p>
              <Button onClick={handleGenerateDaily} className="mt-4">
                Generate Insights
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Weekly Report
              </CardTitle>
              <p className="text-sm text-slate-500 mt-2">AI-generated weekly summary</p>
            </div>
            <Button 
              onClick={handleGenerateWeekly} 
              disabled={generatingWeekly}
              variant="outline"
            >
              {generatingWeekly ? 'Generating...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {weeklyLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : weeklyReport ? (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Summary
                </h3>
                <p className="text-slate-700 dark:text-slate-300">
                  {typeof weeklyReport.report === 'string' 
                    ? weeklyReport.report 
                    : weeklyReport.report.summary}
                </p>
              </div>

              {/* Highlights */}
              {weeklyReport.report?.highlights && weeklyReport.report.highlights.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Highlights</h3>
                  <ul className="space-y-2">
                    {weeklyReport.report.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span className="text-slate-700 dark:text-slate-300">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {weeklyReport.report?.recommendations && weeklyReport.report.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {weeklyReport.report.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">→</span>
                        <span className="text-slate-700 dark:text-slate-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Stats */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Total Events</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {weeklyReport.data.total_events?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Productivity</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {Math.round(weeklyReport.data.productivity_score)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Peak Hour</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {weeklyReport.data.peak_hour}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Peak Day</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {weeklyReport.data.peak_day}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No weekly report available. Generate your first report!</p>
              <Button onClick={handleGenerateWeekly} className="mt-4">
                Generate Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}