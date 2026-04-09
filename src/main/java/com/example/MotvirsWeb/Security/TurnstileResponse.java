package com.example.MotvirsWeb.Security;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class TurnstileResponse {
    private boolean success;
    
    @JsonProperty("error-codes")
    private List<String> errorCodes;
    
    private String challenge_ts;
    private String hostname;
}
