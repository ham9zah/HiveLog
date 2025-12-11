const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze discussion and generate wiki content
 */
async function synthesizeDiscussion(post, comments) {
  try {
    // Prepare discussion context
    const discussionContext = prepareDiscussionContext(post, comments);
    
    // Generate comprehensive wiki
    const wikiContent = await generateWikiContent(discussionContext);
    
    return wikiContent;
  } catch (error) {
    console.error('Error in AI synthesis:', error);
    throw new Error('Failed to synthesize discussion');
  }
}

/**
 * Prepare discussion context for AI
 */
function prepareDiscussionContext(post, comments) {
  // Sort comments by vote score
  const sortedComments = comments
    .filter(c => !c.isDeleted)
    .sort((a, b) => b.voteScore - a.voteScore);
  
  // Get top comments (high quality)
  const topComments = sortedComments.slice(0, 50);
  
  // Format for AI
  const formattedComments = topComments.map(comment => ({
    content: comment.content,
    voteScore: comment.voteScore,
    author: comment.author.username,
    attachments: comment.attachments,
    isHighQuality: comment.isHighQuality
  }));
  
  return {
    title: post.title,
    content: post.content,
    category: post.category,
    tags: post.tags,
    comments: formattedComments,
    totalComments: comments.length,
    attachments: post.attachments
  };
}

/**
 * Generate wiki content using OpenAI
 */
async function generateWikiContent(context) {
  const prompt = `
أنت محلل خبير للنقاشات. مهمتك هي تحويل نقاش متشعب إلى محتوى ويكي منظم وشامل.

# معلومات النقاش:
العنوان: ${context.title}
المحتوى الأصلي: ${context.content}
الفئة: ${context.category}
الوسوم: ${context.tags.join(', ')}
عدد التعليقات: ${context.totalComments}

# أفضل التعليقات:
${context.comments.map((c, i) => `
${i + 1}. المستخدم @${c.author} (تصويت: ${c.voteScore})
${c.content}
`).join('\n')}

# المطلوب منك:
قم بتحليل هذا النقاش وإنشاء محتوى ويكي منظم بصيغة JSON يحتوي على:

1. **summary**: ملخص شامل (200-300 كلمة) يجمع جوهر النقاش والنتائج الرئيسية

2. **opinions**: تصنيف الآراء إلى:
   - supporting: الآراء المؤيدة (مع قوة كل رأي: strong/moderate/weak)
   - opposing: الآراء المعارضة
   - neutral: الآراء المحايدة أو الإضافية

3. **keyPoints**: أهم النقاط التي تم طرحها (5-7 نقاط) مع تحديد الأهمية (high/medium/low)

4. **pendingQuestions**: أسئلة معلقة تحتاج لمزيد من النقاش (3-5 أسئلة)

5. **conclusion**: خلاصة نهائية (100-150 كلمة)

# تعليمات مهمة:
- اكتب بالعربية الفصحى
- كن موضوعياً ومحايداً
- احتفظ بالدقة والمصداقية
- اربط كل نقطة بالتعليقات المصدرية (استخدم فهرس التعليق)
- ركز على الجودة لا الكمية

أرجع النتيجة بصيغة JSON فقط، بدون أي نص إضافي.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "أنت محلل محتوى خبير متخصص في تلخيص وتنظيم النقاشات باللغة العربية. تستجيب دائماً بصيغة JSON صحيحة."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(completion.choices[0].message.content);
  
  // Map comment indices to actual comment references
  const processedResult = mapCommentReferences(result, context.comments);
  
  return processedResult;
}

/**
 * Map comment references from indices to IDs
 */
function mapCommentReferences(wikiContent, comments) {
  // This function would map the comment indices used in AI response
  // back to actual comment IDs for database storage
  
  // For now, return as is - you can enhance this later
  return wikiContent;
}

/**
 * Update existing wiki with new high-quality comments
 */
async function updateWiki(existingWiki, newComments, post) {
  const updatePrompt = `
# محتوى الويكي الحالي (النسخة ${existingWiki.version}):

الملخص: ${existingWiki.summary}

# تعليقات جديدة ذات جودة عالية:
${newComments.map((c, i) => `
${i + 1}. @${c.author.username} (تصويت: ${c.voteScore})
${c.content}
`).join('\n')}

# المطلوب:
قم بتحديث محتوى الويكي بناءً على المعلومات الجديدة. حافظ على الهيكل القائم وأضف أو عدل فقط ما يحتاج تحديث.

أرجع JSON بنفس الهيكل السابق مع:
- summary محدث
- opinions محدثة
- keyPoints محدثة أو جديدة
- pendingQuestions محدثة
- conclusion محدث
- changes: وصف مختصر للتغييرات المضافة
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "أنت محرر ويكي خبير. تقوم بتحديث المحتوى بناءً على معلومات جديدة بطريقة احترافية."
      },
      {
        role: "user",
        content: updatePrompt
      }
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content);
}

/**
 * Classify comment sentiment and quality
 */
async function analyzeComment(comment, postContext) {
  // Simple analysis without API call for now
  // Can be enhanced with OpenAI if needed
  
  const wordCount = comment.content.split(' ').length;
  const hasLinks = comment.content.includes('http');
  const hasQuestions = comment.content.includes('?');
  
  return {
    sentiment: comment.voteScore > 5 ? 'positive' : comment.voteScore < -5 ? 'negative' : 'neutral',
    quality: comment.voteScore > 10 && wordCount > 50 ? 'high' : 'moderate',
    isConstructive: wordCount > 30 && !comment.content.includes('!'.repeat(3))
  };
}

module.exports = {
  synthesizeDiscussion,
  updateWiki,
  analyzeComment
};
