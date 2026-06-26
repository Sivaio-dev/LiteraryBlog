package com.blog.literary_blog.services;

import com.blog.literary_blog.models.Like;
import com.blog.literary_blog.models.Post;
import com.blog.literary_blog.repositories.LikeRepository;
import com.blog.literary_blog.repositories.PostRepository;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
@RequiredArgsConstructor
@Slf4j
public class LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final EntityManager entityManager;

    public String getVisitorIdentifier(HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        String raw = ip + "|" + userAgent;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Hashing algorithm not available", e);
        }
    }

    @Transactional
    public Like toggleLike(Long postId, HttpServletRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        String visitorId = getVisitorIdentifier(request);

        Like existing = likeRepository.findByPostIdAndVisitorIdentifier(postId, visitorId).orElse(null);
        Like result = null;
        if (existing != null) {
            likeRepository.delete(existing);
        } else {
            Like like = Like.builder()
                    .post(post)
                    .visitorIdentifier(visitorId)
                    .build();
            result = likeRepository.save(like);
        }
        // Flush and clear to avoid stale state in future queries
        entityManager.flush();
        entityManager.clear();
        return result;
    }

    public long getLikeCount(Long postId) {
        return likeRepository.countByPostId(postId);
    }

    public boolean hasUserLiked(Long postId, HttpServletRequest request) {
        String visitorId = getVisitorIdentifier(request);
        return likeRepository.findByPostIdAndVisitorIdentifier(postId, visitorId).isPresent();
    }
}
