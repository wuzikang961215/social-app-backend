const TreeHolePost = require('../models/TreeHolePost');

class TreeHoleController {
  // Get all posts (anonymous)
  async getPosts(req, res) {
    try {
      const userId = req.user.id;
      
      const posts = await TreeHolePost
        .find()
        .sort({ createdAt: -1 })
        .limit(100) // Limit to recent 100 posts
        .lean();
      
      // Add hasLiked flag for current user
      const postsWithLikeStatus = posts.map(post => ({
        id: post._id.toString(),
        content: post.content,
        likes: post.likeCount || 0,
        hasLiked: post.likes.some(likeId => likeId.toString() === userId),
        createdAt: post.createdAt
      }));
      
      res.json({
        success: true,
        data: postsWithLikeStatus
      });
    } catch (error) {
      console.error('Error fetching tree hole posts:', error);
      res.status(500).json({
        success: false,
        message: '获取失败，请稍后再试'
      });
    }
  }
  
  // Create a new post (anonymous)
  async createPost(req, res) {
    try {
      const { content } = req.body;
      const userId = req.user.id;
      
      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: '内容不能为空'
        });
      }
      
      if (content.length > 300) {
        return res.status(400).json({
          success: false,
          message: '内容不能超过300字'
        });
      }
      
      const post = new TreeHolePost({
        content: content.trim(),
        author: userId // Store but never expose
      });
      
      await post.save();
      
      res.status(201).json({
        success: true,
        message: '发布成功',
        data: {
          id: post.id,
          content: post.content,
          likes: 0,
          hasLiked: false,
          createdAt: post.createdAt
        }
      });
    } catch (error) {
      console.error('Error creating tree hole post:', error);
      res.status(500).json({
        success: false,
        message: '发布失败，请稍后再试'
      });
    }
  }
  
  // Toggle like on a post
  async toggleLike(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user.id;
      
      const post = await TreeHolePost.findById(postId);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: '内容不存在'
        });
      }
      
      const likeIndex = post.likes.indexOf(userId);
      
      if (likeIndex > -1) {
        // Unlike
        post.likes.splice(likeIndex, 1);
      } else {
        // Like
        post.likes.push(userId);
      }
      
      await post.save();
      
      res.json({
        success: true,
        data: {
          likes: post.likeCount,
          hasLiked: likeIndex === -1
        }
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({
        success: false,
        message: '操作失败，请稍后再试'
      });
    }
  }
}

module.exports = new TreeHoleController();