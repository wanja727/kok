package app.retrievo.content.file;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper;
import java.util.List;

/** YAML 문제 파일을 읽는다. 모르는 항목(오타)이 있으면 거부한다 */
public final class ContentFileParser {

    private static final YAMLMapper YAML = YAMLMapper.builder()
            .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .build();

    private ContentFileParser() {
    }

    public static ContentFile parse(String source, String yaml) {
        try {
            ContentFile file = YAML.readValue(yaml, ContentFile.class);
            if (file == null) {
                throw new ContentValidationException(source, List.of("파일이 비어 있다"));
            }
            return file;
        } catch (JsonProcessingException e) {
            throw new ContentValidationException(source, List.of("YAML을 읽을 수 없다: " + e.getOriginalMessage()));
        }
    }
}
