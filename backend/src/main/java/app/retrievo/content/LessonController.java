package app.retrievo.content;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonQueryService lessons;

    public LessonController(LessonQueryService lessons) {
        this.lessons = lessons;
    }

    @GetMapping
    public List<LessonQueryService.LessonSummary> list() {
        return lessons.list();
    }

    @GetMapping("/{lessonId}/questions")
    public List<QuestionView> questions(@PathVariable long lessonId) {
        return lessons.questions(lessonId);
    }
}
