
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

interface SeriesData {
  date: string;
  value: number;
}

// FRED economic series pool for random selection
const FRED_SERIES = [
  { id: 'UNRATE', title: 'US Unemployment Rate (%)' },
  { id: 'INDPRO', title: 'Industrial Production Index (2017=100)' },
  { id: 'PAYEMS', title: 'Total Non-farm Payroll Employment (thousands)' },
  { id: 'CES0500000003', title: 'Average Hourly Earnings, Total Private ($)' },
  { id: 'AWHMAN', title: 'Average Weekly Hours, Manufacturing (hours)' }
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting AI economy analysis...');

    // Check for required environment variables early
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const fredApiKey = Deno.env.get('FRED_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    if (!fredApiKey) {
      throw new Error('FRED_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch AI-related news with focus on labor and productivity
    console.log('Fetching news from NewsAPI...');
    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?q=(artificial intelligence OR AI) AND (jobs OR employment OR productivity OR automation OR wages OR labor) AND (economy OR economic)&sortBy=publishedAt&pageSize=25&language=en`,
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

    // Select random FRED series for this analysis
    const selectedSeries = FRED_SERIES[Math.floor(Math.random() * FRED_SERIES.length)];
    console.log(`Selected FRED series: ${selectedSeries.id} - ${selectedSeries.title}`);

    // Fetch FRED economic data
    console.log('Fetching FRED economic data...');
    const fredResponse = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=${selectedSeries.id}&api_key=${fredApiKey}&file_type=json&observation_start=2015-01-01`
    );

    if (!fredResponse.ok) {
      throw new Error(`FRED API error: ${fredResponse.status}`);
    }

    const fredData = await fredResponse.json();
    const seriesData: SeriesData[] = fredData.observations
      ?.filter((obs: any) => obs.value !== '.' && !isNaN(parseFloat(obs.value)))
      ?.map((obs: any) => ({
        date: obs.date,
        value: parseFloat(obs.value)
      }))
      ?.slice(-60) || []; // Last ~5 years of monthly data

    console.log(`Fetched ${seriesData.length} FRED data points`);

    // Prepare content for OpenAI analysis
    const articlesText = articles.slice(0, 15).map(article => 
      `Title: ${article.title}\nDescription: ${article.description || 'No description'}\nDate: ${article.publishedAt}\n`
    ).join('\n---\n');

    // Data-driven analysis with OpenAI using JSON mode
    console.log('Analyzing with OpenAI...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an economic analyst. Return ONLY valid JSON:
            {
              "rating": <1-10>,
              "summary": "<500-700 word essay>",
              "prod_labor_score": <0-100>,
              "prod_labor_tip": "<≤120 chars>",
              "american_dream_score": <0-100>,
              "american_dream_tooltip": "<≤120 chars>"
            }
            
            Writing guidance for summary (500–700 words ≈ 3,500–4,500 characters):
            • Start with a concise thesis on AI's current economic influence.
            • Dedicate the first half to real-time developments pulled from today's news (cite specific companies, policies, job numbers).
            • Dedicate the second half to long-term structural themes: productivity, wage dynamics, education/training needs, regulation, demographic pressures, etc.—link them back to the fresh news.
            • Close with 1–2 forward-looking sentences on plausible scenarios over the next 3-5 years.
            
            Scale – American Dream Score:
            0-40 = Low mobility & opportunity
            41-70 = Mixed signals  
            71-100 = Strong upward mobility, near-ideal American Dream
            
            Analyze the provided news articles about AI's impact on labor markets and the economy. Focus on:
            - Actual data points, statistics, and trends mentioned in the articles
            - Real company announcements, job market changes, and economic indicators
            - Concrete examples of productivity gains vs. labor market effects
            - Specific policy responses and industry developments reported
            
            Base your analysis strictly on the actual news content provided. Do not invent data or statistics. Strictly no markdown or code-fences—pure JSON.`
          },
          {
            role: 'user',
            content: `Analyze these recent news articles about AI's impact on labor markets and economics for data-driven insights:\n\n${articlesText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const rawContent = openaiData.choices[0].message.content;

    console.log('Raw OpenAI response:', rawContent);

    // Parse the AI response with robust error handling
    let analysis;
    try {
      // Clean the response in case there are any markdown artifacts
      const cleanedContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedContent);
      
      // Validate the required fields
      if (!analysis.rating || !analysis.summary || 
          !analysis.prod_labor_score || !analysis.prod_labor_tip || 
          !analysis.american_dream_score || !analysis.american_dream_tooltip) {
        throw new Error('Missing required fields in AI response');
      }
      
      // Validate rating is within bounds
      if (typeof analysis.rating !== 'number' || analysis.rating < 1 || analysis.rating > 10) {
        throw new Error('Rating must be a number between 1 and 10');
      }

      // Validate prod_labor_score is within bounds
      if (typeof analysis.prod_labor_score !== 'number' || analysis.prod_labor_score < 0 || analysis.prod_labor_score > 100) {
        throw new Error('Productivity vs Labor score must be a number between 0 and 100');
      }

      // Validate american_dream_score is within bounds
      if (typeof analysis.american_dream_score !== 'number' || analysis.american_dream_score < 0 || analysis.american_dream_score > 100) {
        throw new Error('American Dream score must be a number between 0 and 100');
      }

    } catch (parseError) {
      console.error('AI JSON parsing failed:', parseError.message);
      console.error('Raw content that failed to parse:', rawContent);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'AI response parsing failed',
          details: parseError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Analysis completed, storing in database...');

    // Store the analysis in Supabase with FRED data and new scores
    const { data, error } = await supabase
      .from('reports')
      .insert({
        rating: analysis.rating,
        summary: analysis.summary,
        productivity_insight: analysis.productivity_insight,
        american_dream_impact: analysis.american_dream_impact,
        prod_labor_score: analysis.prod_labor_score,
        prod_labor_tooltip: analysis.prod_labor_tip,
        american_dream_score: analysis.american_dream_score,
        american_dream_tooltip: analysis.american_dream_tooltip,
        series_id: selectedSeries.id,
        series_title: selectedSeries.title,
        series_data: seriesData
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Database insertion failed',
          details: error.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Analysis stored successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        report: data,
        articlesAnalyzed: articles.length,
        fredSeries: selectedSeries.title
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
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
