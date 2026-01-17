import google.generativeai as genai
from flask import current_app
from datetime import datetime, timedelta
import json


class GeminiAI:
    """Gemini AI integration for generating insights"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or current_app.config.get('GEMINI_API_KEY')
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
    
    def is_configured(self):
        """Check if Gemini AI is configured"""
        return self.model is not None
    
    def generate_daily_summary(self, events_data):
        """
        Generate daily summary from browsing events
        
        Args:
            events_data: List of event dictionaries with type, domain, timestamp
        
        Returns:
            str: AI-generated summary
        """
        if not self.is_configured():
            return "AI insights not configured. Please add GEMINI_API_KEY to environment."
        
        try:
            # Prepare data summary
            domains = {}
            event_types = {}
            
            for event in events_data:
                # Count domains
                domain = event.get('domain')
                if domain:
                    domains[domain] = domains.get(domain, 0) + 1
                
                # Count event types
                event_type = event.get('type')
                if event_type:
                    event_types[event_type] = event_types.get(event_type, 0) + 1
            
            # Sort by frequency
            top_domains = sorted(domains.items(), key=lambda x: x[1], reverse=True)[:10]
            
            # Create prompt
            prompt = f"""
            Analyze this browsing activity data and provide a concise daily summary (3-4 sentences):
            
            Total Events: {len(events_data)}
            
            Top Domains Visited:
            {chr(10).join([f"- {domain}: {count} visits" for domain, count in top_domains])}
            
            Event Types:
            {chr(10).join([f"- {etype}: {count}" for etype, count in event_types.items()])}
            
            Provide insights about:
            1. Main focus areas (work, entertainment, social media, etc.)
            2. Productivity level
            3. Any interesting patterns
            
            Keep it friendly and actionable.
            """
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"Failed to generate summary: {str(e)}"
    
    def generate_productivity_insights(self, time_spent_data, productivity_score):
        """
        Generate productivity insights
        
        Args:
            time_spent_data: Dict of {domain: minutes}
            productivity_score: Float between 0-100
        
        Returns:
            str: AI-generated insights
        """
        if not self.is_configured():
            return "AI insights not configured."
        
        try:
            # Prepare data
            top_sites = sorted(time_spent_data.items(), key=lambda x: x[1], reverse=True)[:10]
            
            prompt = f"""
            Analyze this productivity data and provide actionable insights (3-4 sentences):
            
            Productivity Score: {productivity_score}/100
            
            Time Spent on Sites:
            {chr(10).join([f"- {domain}: {round(minutes/60, 2)} hours" for domain, minutes in top_sites])}
            
            Provide:
            1. Assessment of productivity level
            2. Specific recommendations to improve
            3. Positive reinforcement for good habits
            
            Be encouraging and specific.
            """
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"Failed to generate insights: {str(e)}"
    
    def categorize_domain(self, domain, title=None):
        """
        Categorize a domain using AI
        
        Args:
            domain: Website domain
            title: Optional page title
        
        Returns:
            str: Category (work, entertainment, social, learning, shopping, etc.)
        """
        if not self.is_configured():
            # Fallback to simple categorization
            return self._simple_categorize(domain)
        
        try:
            prompt = f"""
            Categorize this website into ONE of these categories:
            - work (productivity tools, work-related sites)
            - learning (educational content, documentation, courses)
            - social (social media, messaging)
            - entertainment (videos, games, music)
            - shopping (e-commerce)
            - news (news sites, blogs)
            - other
            
            Domain: {domain}
            {"Title: " + title if title else ""}
            
            Respond with ONLY the category name in lowercase.
            """
            
            response = self.model.generate_content(prompt)
            category = response.text.strip().lower()
            
            # Validate category
            valid_categories = ['work', 'learning', 'social', 'entertainment', 'shopping', 'news', 'other']
            return category if category in valid_categories else 'other'
            
        except Exception as e:
            return self._simple_categorize(domain)
    
    def _simple_categorize(self, domain):
        """Simple rule-based categorization fallback"""
        
        work_keywords = ['github', 'stackoverflow', 'docs', 'aws', 'google.com/cloud', 'notion', 'trello', 'asana', 'slack']
        social_keywords = ['facebook', 'twitter', 'instagram', 'reddit', 'tiktok', 'linkedin']
        entertainment_keywords = ['youtube', 'netflix', 'twitch', 'spotify', 'hulu']
        shopping_keywords = ['amazon', 'ebay', 'shopify', 'etsy']
        news_keywords = ['news', 'bbc', 'cnn', 'nytimes', 'reuters']
        
        domain_lower = domain.lower()
        
        if any(kw in domain_lower for kw in work_keywords):
            return 'work'
        elif any(kw in domain_lower for kw in social_keywords):
            return 'social'
        elif any(kw in domain_lower for kw in entertainment_keywords):
            return 'entertainment'
        elif any(kw in domain_lower for kw in shopping_keywords):
            return 'shopping'
        elif any(kw in domain_lower for kw in news_keywords):
            return 'news'
        else:
            return 'other'
    
    def detect_patterns(self, events_by_hour, events_by_day):
        """
        Detect and explain usage patterns
        
        Args:
            events_by_hour: Dict of {hour: count}
            events_by_day: Dict of {day: count}
        
        Returns:
            str: Pattern analysis
        """
        if not self.is_configured():
            return "AI pattern detection not configured."
        
        try:
            prompt = f"""
            Analyze these browsing patterns and provide insights (2-3 sentences):
            
            Activity by Hour:
            {chr(10).join([f"- {hour}:00 - {count} events" for hour, count in sorted(events_by_hour.items())])}
            
            Activity by Day of Week:
            {chr(10).join([f"- {day}: {count} events" for day, count in events_by_day.items()])}
            
            Identify:
            1. Peak productivity times
            2. Potential improvements to schedule
            3. Work-life balance observations
            
            Be specific and actionable.
            """
            
            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"Failed to detect patterns: {str(e)}"
    
    def generate_weekly_report(self, weekly_data):
        """
        Generate comprehensive weekly report
        
        Args:
            weekly_data: Dict containing all weekly analytics
        
        Returns:
            dict: Structured report with insights
        """
        if not self.is_configured():
            return {
                'summary': 'AI insights not configured.',
                'highlights': [],
                'recommendations': []
            }
        
        try:
            prompt = f"""
            Create a weekly report based on this data. Format as JSON with three sections:
            
            Data:
            - Total Events: {weekly_data.get('total_events', 0)}
            - Top Domains: {', '.join([f"{d['domain']} ({d['count']})" for d in weekly_data.get('top_domains', [])[:5]])}
            - Productivity Score: {weekly_data.get('productivity_score', 0)}/100
            - Most Active Hour: {weekly_data.get('peak_hour', 'N/A')}
            - Most Active Day: {weekly_data.get('peak_day', 'N/A')}
            
            Respond with ONLY valid JSON in this format:
            {{
                "summary": "2-3 sentence overview",
                "highlights": ["highlight 1", "highlight 2", "highlight 3"],
                "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
            }}
            """
            
            response = self.model.generate_content(prompt)
            
            # Try to parse JSON response
            try:
                report = json.loads(response.text)
                return report
            except json.JSONDecodeError:
                # Fallback if AI doesn't return valid JSON
                return {
                    'summary': response.text[:200],
                    'highlights': [],
                    'recommendations': []
                }
            
        except Exception as e:
            return {
                'summary': f'Failed to generate report: {str(e)}',
                'highlights': [],
                'recommendations': []
            }


# Global instance
gemini_ai = None


def get_gemini_ai():
    """Get or create Gemini AI instance"""
    global gemini_ai
    
    if gemini_ai is None:
        gemini_ai = GeminiAI()
    
    return gemini_ai