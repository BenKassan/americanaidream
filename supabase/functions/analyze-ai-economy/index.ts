
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

    // Check for required environment variables early
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
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

    // Prepare content for OpenAI analysis
    const articlesText = articles.slice(0, 15).map(article => 
      `Title: ${article.title}\nDescription: ${article.description || 'No description'}\nDate: ${article.publishedAt}\n`
    ).join('\n---\n');

    // Enhanced analysis with OpenAI using JSON mode
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
            content: `You are Dr. Elena Rodriguez, a world-renowned economist and leading expert on technological disruption and labor markets. You have published extensively on AI's impact on the American Dream, labor value, and economic inequality. 

            Analyze the provided news articles with the depth and insight of a Nobel Prize-caliber economist. Focus specifically on:
            - How AI is reshaping the traditional American Dream of upward mobility through work
            - The divergence between productivity gains and labor compensation
            - Data-driven trends in job displacement vs. job creation
            - The changing value and meaning of human labor
            - Economic implications for middle-class prosperity

            Return ONLY valid JSON with exactly these keys:
            - rating: number between 1-10 (1 = catastrophic for American workers/Dream, 10 = transformative opportunity)
            - summary: comprehensive analysis (800-1000 characters) that includes specific economic insights, data trends, and implications for the American workforce
            - productivity_insight: brief insight on productivity vs. labor value trends (200-250 characters)
            - american_dream_impact: assessment of impact on traditional American Dream ideals (200-250 characters)
            
            Write with the authority and depth expected from a top-tier economist. Include data-driven observations and nuanced economic analysis.`
          },
          {
            role: 'user',
            content: `Analyze these recent AI and labor market articles for their economic implications on American workers and the evolving nature of work:\n\n${articlesText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
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
      if (!analysis.rating || !analysis.summary || !analysis.productivity_insight || !analysis.american_dream_impact) {
        throw new Error('Missing required fields in AI response');
      }
      
      // Validate rating is within bounds
      if (typeof analysis.rating !== 'number' || analysis.rating < 1 || analysis.rating > 10) {
        throw new Error('Rating must be a number between 1 and 10');
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

    // Store the enhanced analysis in Supabase
    const { data, error } = await supabase
      .from('reports')
      .insert({
        rating: analysis.rating,
        summary: analysis.summary,
        productivity_insight: analysis.productivity_insight,
        american_dream_impact: analysis.american_dream_impact
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
