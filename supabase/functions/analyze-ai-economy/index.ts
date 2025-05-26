
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI economy analysis...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch AI-related news from NewsAPI
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }

    console.log('Fetching news from NewsAPI...');
    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=artificial intelligence economy OR AI economic impact OR automation jobs&sortBy=publishedAt&pageSize=20&language=en`,
      {
        headers: {
          'X-API-Key': newsApiKey
        }
      }
    );

    if (!newsResponse.ok) {
      throw new Error(`NewsAPI error: ${newsResponse.status}`);
    }

    const newsData = await newsResponse.json();
    const articles: NewsArticle[] = newsData.articles || [];

    console.log(`Found ${articles.length} articles`);

    if (articles.length === 0) {
      throw new Error('No articles found');
    }

    // Prepare content for OpenAI analysis
    const articlesText = articles.slice(0, 10).map(article => 
      `Title: ${article.title}\nDescription: ${article.description || 'No description'}\n`
    ).join('\n---\n');

    // Analyze with OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Analyzing with OpenAI...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI economist analyzing the economic impact of artificial intelligence. 
            Based on the provided news articles, provide:
            1. A numerical rating from 1-10 (1 = very negative economic impact, 10 = very positive economic impact)
            2. A comprehensive summary analyzing the current AI economic trends
            
            Format your response as JSON with exactly this structure:
            {
              "rating": <number between 1-10 with one decimal place>,
              "summary": "<detailed analysis in markdown format with sections like **Key AI Developments**, **Economic Implications**, and **Overall Assessment**>"
            }`
          },
          {
            role: 'user',
            content: `Analyze these recent AI and economy related news articles:\n\n${articlesText}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const analysis = JSON.parse(openaiData.choices[0].message.content);

    console.log('Analysis completed, storing in database...');

    // Store the analysis in Supabase
    const { data, error } = await supabase
      .from('reports')
      .insert({
        rating: analysis.rating,
        summary: analysis.summary
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Analysis stored successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        report: data,
        articlesAnalyzed: articles.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-ai-economy function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
