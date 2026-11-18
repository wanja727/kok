package app.retrievo.content.file;

import java.util.List;

/** 형식이 틀린 문제 파일. 이유를 하나씩이 아니라 한 번에 모두 알려준다 */
public class ContentValidationException extends RuntimeException {

    private final String source;
    private final List<String> errors;

    public ContentValidationException(String source, List<String> errors) {
        super(source + ": " + String.join("; ", errors));
        this.source = source;
        this.errors = List.copyOf(errors);
    }

    public String getSource() {
        return source;
    }

    public List<String> getErrors() {
        return errors;
    }
}
