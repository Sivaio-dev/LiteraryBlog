package com.blog.literary_blog.dto;

import com.blog.literary_blog.models.PostStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostDTO {
    private String title;
    private String content;
    private String coverImage;
    private PostStatus status;
    private List<String> categorySlugs;
}
