
import { assert, describe, it } from "vitest";
import { Context } from "../interfaces";
import { PublicKeyResolverEngine } from "../PublicKeyResolverEngine";
import { MsoMdocVerifier } from './MsoMdocVerifier';
import { CredentialVerificationError } from "../error";


const issuerSignedB64U = `omppc3N1ZXJBdXRohEOhASahGCGCWQJ4MIICdDCCAhugAwIBAgIBAjAKBggqhkjOPQQDAjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwHhcNMjQwNTMxMDgxMzE3WhcNMjUwNzA1MDgxMzE3WjBsMQswCQYDVQQGEwJERTEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxCjAIBgNVBAsMAUkxMjAwBgNVBAMMKVNQUklORCBGdW5rZSBFVURJIFdhbGxldCBQcm90b3R5cGUgSXNzdWVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEOFBq4YMKg4w5fTifsytwBuJf_7E7VhRPXiNm52S3q1ETIgBdXyDK3kVxGxgeHPivLP3uuMvS6iDEc7qMxmvduKOBkDCBjTAdBgNVHQ4EFgQUiPhCkLErDXPLW2_J0WVeghyw-mIwDAYDVR0TAQH_BAIwADAOBgNVHQ8BAf8EBAMCB4AwLQYDVR0RBCYwJIIiZGVtby5waWQtaXNzdWVyLmJ1bmRlc2RydWNrZXJlaS5kZTAfBgNVHSMEGDAWgBTUVhjAiTjoDliEGMl2Yr-ru8WQvjAKBggqhkjOPQQDAgNHADBEAiAbf5TzkcQzhfWoIoyi1VN7d8I9BsFKm1MWluRph2byGQIgKYkdrNf2xXPjVSbjW_U_5S5vAEC5XxcOanusOBroBbVZAn0wggJ5MIICIKADAgECAhQHkT1BVm2ZRhwO0KMoH8fdVC_vaDAKBggqhkjOPQQDAjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwHhcNMjQwNTMxMDY0ODA5WhcNMzQwNTI5MDY0ODA5WjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARgbN3AUOdzv4qfmJsC8I4zyR7vtVDGp8xzBkvwhogD5YJE5wJ-Zj-CIf3aoyu7mn-TI6K8TREL8ht0w428OhTJo2YwZDAdBgNVHQ4EFgQU1FYYwIk46A5YhBjJdmK_q7vFkL4wHwYDVR0jBBgwFoAU1FYYwIk46A5YhBjJdmK_q7vFkL4wEgYDVR0TAQH_BAgwBgEB_wIBADAOBgNVHQ8BAf8EBAMCAYYwCgYIKoZIzj0EAwIDRwAwRAIgYSbvCRkoe39q1vgx0WddbrKufAxRPa7XfqB22XXRjqECIG5MWq9Vi2HWtvHMI_TFZkeZAr2RXLGfwY99fbsQjPOzWQS62BhZBLWnZnN0YXR1c6Frc3RhdHVzX2xpc3SiY2lkeBhsY3VyaXhWaHR0cHM6Ly9kZW1vLnBpZC1pc3N1ZXIuYnVuZGVzZHJ1Y2tlcmVpLmRlL3N0YXR1cy84ODc5M2MwMy0xNmFkLTQ0NjgtYmVmNy1jMDgzZDM4YWUyMTlnZG9jVHlwZXdldS5ldXJvcGEuZWMuZXVkaS5waWQuMWd2ZXJzaW9uYzEuMGx2YWxpZGl0eUluZm-jZnNpZ25lZMB0MjAyNS0wMi0xOFQxNDoxMjowNFppdmFsaWRGcm9twHQyMDI1LTAyLTE4VDE0OjEyOjA0Wmp2YWxpZFVudGlswHQyMDI1LTAzLTA0VDE0OjEyOjA0Wmx2YWx1ZURpZ2VzdHOhd2V1LmV1cm9wYS5lYy5ldWRpLnBpZC4xtgBYIKuGxnFMGhNio5-VUJKePlkmw33mloMA9fgqUR0ynOoJAVggWxNyUrVxTPW2riSGxx_U_irluD-vcJIOGGrafGo6JpwCWCDKOCdlxlbeX7mztFkzrM7MsZHs3gEyrmC79X3N2VpxkgNYICmI6iaQPBePM7fzBXqPyX5Gr-wNnWNCNb7wDUz4VDIRBFggfCuu8bFboi9BiRPsM447Ncg9A7K7A28iTEjVy9fmjBIFWCC6z1AlQM8ttJfuIQtPYlurlamh3MvAbSaQoUzAn-9L9gZYIKD1mVbZ5zb-_sp_E6vZCQ_U2QAQVNtbWAznR4xUm6LoB1ggWAn0OSPMM-m8NbgBZ-D6qLV0BEVeSnR4DIsUPUOZDbsIWCDyTDBH9XjK_JIq_W7d19UpmMq1pd1CjrmhfIHsctg3gwlYIK7ejRc3g-pfNGM0WHv4Oh1jfshl03Jvm3cxKHFnIIXmClggjPVDgZmiJEpnM6Zo_mzUQAbW5M6QZuRH43L6BqVeT7wLWCCSVNDu2CjnRkbC7_6m6-G6h8dTDWvlmGz0WD-MUCGERwxYIDpAXdFHgnACMgICXQpJi9nzBDRjsJ8bY1htM9GtgZlKDVggvhyWJk8WGQgokFghnd9DyZKyo8b6VrfAX8WTB0vH1QkOWCBLJFY_nbKL1x-5fbJCqS1IgEn_uMm9NJm2vqorCWwwPg9YIJIg7rTS_E3HAYjcjdV6WSpgZuXa8IKo7f5aC9ibPXQzEFggc_BlS8FdmjVtSqXrA2Xh58naoO0XdTbwclGo9itNTIERWCDzIo5muAIWaawEG69bUPG4mI4pEB5dUhadaUeMUEuwIhJYIEALsAqnwl3T1nC7YtOeDj-7OEHlmcwhCZjY2Qgsr2vCE1ggwG6In0GuGqO1isPXfh2EA7-mi18JAhfumCyQUA5FpYYUWCAL6kBisfFYUIU06t2d0UeqElM-c49VrVqfgYYSIx2JpRVYICYx93c95xCPFdhE03ZlReMnLGSjT_SJgEBMeErv0VlXbWRldmljZUtleUluZm-haWRldmljZUtleaQBAiABIVgganiJYJ0goJBbFzWZ52BDtTvTP1Fqb6k80C4UBl6JrFwiWCCWf2o4RIOTRI_UGubc0rCyIDo-o_LYRzYRnWzos3gcSm9kaWdlc3RBbGdvcml0aG1nU0hBLTI1NlhAcBP9-i1suGc_TnH7z4Mp8jFAz2Q__4w7Ju7dDG93XWfCE15E15WYaXUnkYY80tStLInk7nEi6IqEPHJPUyWiyGpuYW1lU3BhY2VzoXdldS5ldXJvcGEuZWMuZXVkaS5waWQuMZbYGFhRpGZyYW5kb21Q6lwO6tOJcjKhPDMrRPrRFGhkaWdlc3RJRABsZWxlbWVudFZhbHVlGDxxZWxlbWVudElkZW50aWZpZXJsYWdlX2luX3llYXJz2BhYT6RmcmFuZG9tUBwuvU0MGGbT2h94xazpeqloZGlnZXN0SUQBbGVsZW1lbnRWYWx1ZfVxZWxlbWVudElkZW50aWZpZXJrYWdlX292ZXJfMTLYGFhdpGZyYW5kb21Qo6kOsHqedb_9xHVlfCXHf2hkaWdlc3RJRAJsZWxlbWVudFZhbHVlZTUxMTQ3cWVsZW1lbnRJZGVudGlmaWVydHJlc2lkZW50X3Bvc3RhbF9jb2Rl2BhYVaRmcmFuZG9tUP6aK3BnaJ4ssYCnhgPSaZpoZGlnZXN0SUQDbGVsZW1lbnRWYWx1ZWZCRVJMSU5xZWxlbWVudElkZW50aWZpZXJrYmlydGhfcGxhY2XYGFhPpGZyYW5kb21QGR_ZD_ylLFjp_gFyoXxR0WhkaWdlc3RJRARsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8xNNgYWFWkZnJhbmRvbVByTlMf_mCOUvaECM5veox_aGRpZ2VzdElEBWxlbGVtZW50VmFsdWViREVxZWxlbWVudElkZW50aWZpZXJvaXNzdWluZ19jb3VudHJ52BhYY6RmcmFuZG9tUED3uH1EYolIFfAdQr8v6pVoZGlnZXN0SUQGbGVsZW1lbnRWYWx1ZcB0MTk2NC0wOC0xMlQwMDowMDowMFpxZWxlbWVudElkZW50aWZpZXJqYmlydGhfZGF0ZdgYWE-kZnJhbmRvbVBucDIRMDGt1bMXZVQopw3OaGRpZ2VzdElEB2xlbGVtZW50VmFsdWX0cWVsZW1lbnRJZGVudGlmaWVya2FnZV9vdmVyXzY12BhYVqRmcmFuZG9tUEQqTillqXQcpIwC8F2YOMloZGlnZXN0SUQIbGVsZW1lbnRWYWx1ZWJERXFlbGVtZW50SWRlbnRpZmllcnByZXNpZGVudF9jb3VudHJ52BhYT6RmcmFuZG9tUMoKXZZ4ZDwVRRL4IQ7oDEFoZGlnZXN0SUQJbGVsZW1lbnRWYWx1ZfVxZWxlbWVudElkZW50aWZpZXJrYWdlX292ZXJfMTbYGFhXpGZyYW5kb21QdJ-5Oz_55VjO0LOBbnoLs2hkaWdlc3RJRApsZWxlbWVudFZhbHVlYkRFcWVsZW1lbnRJZGVudGlmaWVycWlzc3VpbmdfYXV0aG9yaXR52BhYa6RmcmFuZG9tUMexUIlyfvCgcIUu67OBH6doZGlnZXN0SUQLbGVsZW1lbnRWYWx1ZcB4GDIwMjUtMDItMThUMTQ6MTI6MDQuMzc1WnFlbGVtZW50SWRlbnRpZmllcm1pc3N1YW5jZV9kYXRl2BhYVKRmcmFuZG9tUJ_7jstnoovdbm84Cmh2etFoZGlnZXN0SUQMbGVsZW1lbnRWYWx1ZRkHrHFlbGVtZW50SWRlbnRpZmllcm5hZ2VfYmlydGhfeWVhctgYWFmkZnJhbmRvbVAnc4IFpUS4gxjqo-1DsQNvaGRpZ2VzdElEDWxlbGVtZW50VmFsdWVqTVVTVEVSTUFOTnFlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZdgYWE-kZnJhbmRvbVD0dq9e6pNoaa0e_tVlZ-hZaGRpZ2VzdElEDmxlbGVtZW50VmFsdWX1cWVsZW1lbnRJZGVudGlmaWVya2FnZV9vdmVyXzE42BhYU6RmcmFuZG9tUIurbtyPoiia4qsc62iQHIBoZGlnZXN0SUQPbGVsZW1lbnRWYWx1ZWVFUklLQXFlbGVtZW50SWRlbnRpZmllcmpnaXZlbl9uYW1l2BhYY6RmcmFuZG9tUKgfL0gkbSOApy2APkdkNatoZGlnZXN0SUQQbGVsZW1lbnRWYWx1ZXBIRUlERVNUUkHhup5FIDE3cWVsZW1lbnRJZGVudGlmaWVyb3Jlc2lkZW50X3N0cmVldNgYWFGkZnJhbmRvbVA3gWJEwZz8jgsLsfRJvjMQaGRpZ2VzdElEEWxlbGVtZW50VmFsdWViREVxZWxlbWVudElkZW50aWZpZXJrbmF0aW9uYWxpdHnYGFhPpGZyYW5kb21QHSMBCaBxBPPy92dCcmoZvWhkaWdlc3RJRBJsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8yMdgYWFakZnJhbmRvbVB4Df01yH0SBmag1gS4xKL9aGRpZ2VzdElEE2xlbGVtZW50VmFsdWVlS8OWTE5xZWxlbWVudElkZW50aWZpZXJtcmVzaWRlbnRfY2l0edgYWFukZnJhbmRvbVDxOTqapogRuHVS1cLoK7z6aGRpZ2VzdElEFGxlbGVtZW50VmFsdWVmR0FCTEVScWVsZW1lbnRJZGVudGlmaWVycWZhbWlseV9uYW1lX2JpcnRo2BhYaaRmcmFuZG9tUOFMkL6pWaVejQQEv7_aS-loZGlnZXN0SUQVbGVsZW1lbnRWYWx1ZcB4GDIwMjUtMDMtMDRUMTQ6MTI6MDQuMzc1WnFlbGVtZW50SWRlbnRpZmllcmtleHBpcnlfZGF0ZQ`;
const deviceResponseB64U = `uQADZ3ZlcnNpb25jMS4waWRvY3VtZW50c4GjZ2RvY1R5cGV3ZXUuZXVyb3BhLmVjLmV1ZGkucGlkLjFsaXNzdWVyU2lnbmVkuQACam5hbWVTcGFjZXOhd2V1LmV1cm9wYS5lYy5ldWRpLnBpZC4xlNgYWFmkZnJhbmRvbVBUfNevz7XKI6dP-oHvsrT3aGRpZ2VzdElECGxlbGVtZW50VmFsdWVqTVVTVEVSTUFOTnFlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZdgYWFOkZnJhbmRvbVDNT3JVcJ3djTp0BXnyLmIUaGRpZ2VzdElEC2xlbGVtZW50VmFsdWVlRVJJS0FxZWxlbWVudElkZW50aWZpZXJqZ2l2ZW5fbmFtZdgYWFukZnJhbmRvbVC4MtquwSK-63MjkZpprLqoaGRpZ2VzdElEA2xlbGVtZW50VmFsdWVmR0FCTEVScWVsZW1lbnRJZGVudGlmaWVycWZhbWlseV9uYW1lX2JpcnRo2BhYY6RmcmFuZG9tUCazWrq3doaoxVpE0gJe1N9oZGlnZXN0SUQNbGVsZW1lbnRWYWx1ZcB0MTk2NC0wOC0xMlQwMDowMDowMFpxZWxlbWVudElkZW50aWZpZXJqYmlydGhfZGF0ZdgYWE-kZnJhbmRvbVA7fuNwF3jGD2QiLdenoWMraGRpZ2VzdElEB2xlbGVtZW50VmFsdWX1cWVsZW1lbnRJZGVudGlmaWVya2FnZV9vdmVyXzEy2BhYT6RmcmFuZG9tUGa8DfRFMEUpd1o2JghMQjloZGlnZXN0SUQCbGVsZW1lbnRWYWx1ZfVxZWxlbWVudElkZW50aWZpZXJrYWdlX292ZXJfMTTYGFhPpGZyYW5kb21Qa80NMqpAB0i2OQyv8j95oWhkaWdlc3RJRAVsZWxlbWVudFZhbHVl9XFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl8xNtgYWE-kZnJhbmRvbVDJ87WH7qvHclbu4PTPvBQdaGRpZ2VzdElEAGxlbGVtZW50VmFsdWX1cWVsZW1lbnRJZGVudGlmaWVya2FnZV9vdmVyXzE42BhYT6RmcmFuZG9tUItNiaeMwO7ZzV1CVGW4LeBoZGlnZXN0SUQPbGVsZW1lbnRWYWx1ZfVxZWxlbWVudElkZW50aWZpZXJrYWdlX292ZXJfMjHYGFhPpGZyYW5kb21Qby0pEbzynWHUOc-7B2pZBmhkaWdlc3RJRBNsZWxlbWVudFZhbHVl9HFlbGVtZW50SWRlbnRpZmllcmthZ2Vfb3Zlcl82NdgYWFGkZnJhbmRvbVDgYlXKzSHnPThOI0y4m673aGRpZ2VzdElEEGxlbGVtZW50VmFsdWUYPHFlbGVtZW50SWRlbnRpZmllcmxhZ2VfaW5feWVhcnPYGFhUpGZyYW5kb21Q4Jd6ZP3DCJFFKVNFVT_B12hkaWdlc3RJRBVsZWxlbWVudFZhbHVlGQescWVsZW1lbnRJZGVudGlmaWVybmFnZV9iaXJ0aF95ZWFy2BhYVaRmcmFuZG9tUH43o3ghMrqucI7lWk9d7mFoZGlnZXN0SUQKbGVsZW1lbnRWYWx1ZWZCRVJMSU5xZWxlbWVudElkZW50aWZpZXJrYmlydGhfcGxhY2XYGFhRpGZyYW5kb21Q8AOaLrOmDhM7rECRheuQhGhkaWdlc3RJRARsZWxlbWVudFZhbHVlYkRFcWVsZW1lbnRJZGVudGlmaWVya25hdGlvbmFsaXR52BhYVqRmcmFuZG9tUL07clF9bBQDbpWfQQQBOrloZGlnZXN0SUQRbGVsZW1lbnRWYWx1ZWJERXFlbGVtZW50SWRlbnRpZmllcnByZXNpZGVudF9jb3VudHJ52BhYXaRmcmFuZG9tUOokZC6YfIpG84ujLfw1PENoZGlnZXN0SUQJbGVsZW1lbnRWYWx1ZWU1MTE0N3FlbGVtZW50SWRlbnRpZmllcnRyZXNpZGVudF9wb3N0YWxfY29kZdgYWFakZnJhbmRvbVABAOyRDMIBZSH3cZUmepgUaGRpZ2VzdElEAWxlbGVtZW50VmFsdWVlS8OWTE5xZWxlbWVudElkZW50aWZpZXJtcmVzaWRlbnRfY2l0edgYWGOkZnJhbmRvbVCVlpl1xTgpFlqC0o_-yGMDaGRpZ2VzdElEBmxlbGVtZW50VmFsdWVwSEVJREVTVFJB4bqeRSAxN3FlbGVtZW50SWRlbnRpZmllcm9yZXNpZGVudF9zdHJlZXTYGFhVpGZyYW5kb21QSEdXDVlME8NKeLaDyQPRe2hkaWdlc3RJRBRsZWxlbWVudFZhbHVlYkRFcWVsZW1lbnRJZGVudGlmaWVyb2lzc3VpbmdfY291bnRyedgYWFekZnJhbmRvbVDo81fY-gsCPk-oDjwdxANQaGRpZ2VzdElEDmxlbGVtZW50VmFsdWViREVxZWxlbWVudElkZW50aWZpZXJxaXNzdWluZ19hdXRob3JpdHlqaXNzdWVyQXV0aIRDoQEmoRghglkCeDCCAnQwggIboAMCAQICAQIwCgYIKoZIzj0EAwIwgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMB4XDTI0MDUzMTA4MTMxN1oXDTI1MDcwNTA4MTMxN1owbDELMAkGA1UEBhMCREUxHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMQowCAYDVQQLDAFJMTIwMAYDVQQDDClTUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VlcjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABDhQauGDCoOMOX04n7MrcAbiX_-xO1YUT14jZudkt6tREyIAXV8gyt5FcRsYHhz4ryz97rjL0uogxHO6jMZr3bijgZAwgY0wHQYDVR0OBBYEFIj4QpCxKw1zy1tvydFlXoIcsPpiMAwGA1UdEwEB_wQCMAAwDgYDVR0PAQH_BAQDAgeAMC0GA1UdEQQmMCSCImRlbW8ucGlkLWlzc3Vlci5idW5kZXNkcnVja2VyZWkuZGUwHwYDVR0jBBgwFoAU1FYYwIk46A5YhBjJdmK_q7vFkL4wCgYIKoZIzj0EAwIDRwAwRAIgG3-U85HEM4X1qCKMotVTe3fCPQbBSptTFpbkaYdm8hkCICmJHazX9sVz41Um41v1P-UubwBAuV8XDmp7rDga6AW1WQJ9MIICeTCCAiCgAwIBAgIUB5E9QVZtmUYcDtCjKB_H3VQv72gwCgYIKoZIzj0EAwIwgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMB4XDTI0MDUzMTA2NDgwOVoXDTM0MDUyOTA2NDgwOVowgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYGzdwFDnc7-Kn5ibAvCOM8ke77VQxqfMcwZL8IaIA-WCROcCfmY_giH92qMru5p_kyOivE0RC_IbdMONvDoUyaNmMGQwHQYDVR0OBBYEFNRWGMCJOOgOWIQYyXZiv6u7xZC-MB8GA1UdIwQYMBaAFNRWGMCJOOgOWIQYyXZiv6u7xZC-MBIGA1UdEwEB_wQIMAYBAf8CAQAwDgYDVR0PAQH_BAQDAgGGMAoGCCqGSM49BAMCA0cAMEQCIGEm7wkZKHt_atb4MdFnXW6yrnwMUT2u136gdtl10Y6hAiBuTFqvVYth1rbxzCP0xWZHmQK9kVyxn8GPfX27EIzzs1kEutgYWQS1p2ZzdGF0dXOha3N0YXR1c19saXN0omNpZHgYIWN1cml4Vmh0dHBzOi8vZGVtby5waWQtaXNzdWVyLmJ1bmRlc2RydWNrZXJlaS5kZS9zdGF0dXMvODg3OTNjMDMtMTZhZC00NDY4LWJlZjctYzA4M2QzOGFlMjE5Z2RvY1R5cGV3ZXUuZXVyb3BhLmVjLmV1ZGkucGlkLjFndmVyc2lvbmMxLjBsdmFsaWRpdHlJbmZvo2ZzaWduZWTAdDIwMjUtMDItMThUMTQ6MTI6MDRaaXZhbGlkRnJvbcB0MjAyNS0wMi0xOFQxNDoxMjowNFpqdmFsaWRVbnRpbMB0MjAyNS0wMy0wNFQxNDoxMjowNFpsdmFsdWVEaWdlc3RzoXdldS5ldXJvcGEuZWMuZXVkaS5waWQuMbYAWCBCO3oSpWqKZUR8lyQ_w7JqYKlLQz4hz9Vj0pRyWxkkmwFYIHkM735ONBZCYrTOXPW78F4tLznXnVmhvtEl0V9hSdlcAlgg47Cmu7FcRsMQ5qmbTC8dZW39fP8P1Dz0v8pFZ5JLG2wDWCBfBxXYBfUld-d0cYhpP8zgjOtQtX5-dGlf30kCkGpE4ARYIApqGHJxhN18g4mAyGKfvWIfEkg8paVprLpDo1gZOHQFBVggT536a7N4Wy3Hpsit4uRpiBm2JPYiSxuFAhFqQFBX6DIGWCCgVM61tLjIFCEQgNvLx2zuGq3izK3BKfqrqhcRB9qEpAdYIL6p-Yxa3V_j_ztyXQatBHX0mGr0wkowXwyRx4UqqOYiCFgg32f-7ipkR7iEGy0xK57Myii2_P1hRbpK1UQdcELxirkJWCDf93y4i81oMjodX5dcq_lQrEj_Oh_5apigwx6gDfD4jQpYIKD9I4Auzw3scWTiurhgTs5uMvZ20fJ_8k_wfV_D0dAhC1ggckHBrpbStfINvp4LGYyaeooDX4oY8iAtW-0RarG-q4YMWCDm89lYD1h55M4Qa67atX7rsqYaG1THguFxDhv7npXqpA1YIFXi56b9YQFa7i3ONHPYIcEyupNd06a2izkd82CALOibDlggWYt7Vzu4i_lKmYH_A2gfYPMOqvrI3zLzjhxdv1ioZvAPWCBmcIZJdBAIT_D0j5YbN7oW9-Hkoj-3yir2g8BPdtuV1BBYINQGzf5w06WG8yCP1e58Ladx5ZaeVelcHuOCQDGHeYBxEVgg0CpnfXCEXuzuhs8-LQMxziloCZ4w-bvJZTWyOF__fNISWCDNCRYb8KgIO45jYCFO1k09lfdLT87dMYik-BEzoq-JchNYIFUrEIc3bvDFFFgD9KTmk9DKYlk5rWb7qECw4Seb_AzIFFggkz8mwKZwXj8R2kzx7qF3A3U3p4Q8uOl8zN_OHae7HlMVWCAU-2xJ2vH2_CF8mQjcAV4BaxBI04FBOHkZ83A1Sbl-e21kZXZpY2VLZXlJbmZvoWlkZXZpY2VLZXmkAQIgASFYIBJq0ZzR16oAkshkZKlDx3syKecGErSKEYib9mo8npduIlggjeYD3pZFCh-JwZgX7UI5azfRUQxb6iiI2cQ_TJ7_oFhvZGlnZXN0QWxnb3JpdGhtZ1NIQS0yNTZYQAGN5M3cA06sECoJwmOV68x88ssWjOXuaXVd8ob1aE8FaXbk4_GRx3gp5faUL5eEr9A0Vfuec2402ywsXm6kuQBsZGV2aWNlU2lnbmVkuQACam5hbWVTcGFjZXPYGEO5AABqZGV2aWNlQXV0aLkAAW9kZXZpY2VTaWduYXR1cmWEQ6EBJqD2WEDHBZPJa5dEJlG4OC6wGUv4Y_3cn6vwF1wxEbV7VrjcH5Y6cPBY6o6TX-xDNSCoe1vUpib7Z9PBpTI7c7Q3mlLWZnN0YXR1cwA`;

const deviceResponseB64UWalletIssuer = `InVRQURaM1psY25OcGIyNWpNUzR3YVdSdlkzVnRaVzUwYzRHaloyUnZZMVI1Y0dWM1pYVXVaWFZ5YjNCaExtVmpMbVYxWkdrdWNHbGtMakZzYVhOemRXVnlVMmxuYm1Wa3VRQUNhbTVoYldWVGNHRmpaWE9oZDJWMUxtVjFjbTl3WVM1bFl5NWxkV1JwTG5CcFpDNHhnOWdZV0dPa2FHUnBaMlZ6ZEVsRUFIRmxiR1Z0Wlc1MFNXUmxiblJwWm1sbGNtdG1ZVzFwYkhsZmJtRnRaV3hsYkdWdFpXNTBWbUZzZFdWalJHOWxabkpoYm1SdmJWZ2dBaFpjYUNmVktYVWk4WHZnSzRZeTRzSFlISTNYUTN1cWF0TExwM0dkZ1JEWUdGaGpwR2hrYVdkbGMzUkpSQUZ4Wld4bGJXVnVkRWxrWlc1MGFXWnBaWEpxWjJsMlpXNWZibUZ0Wld4bGJHVnRaVzUwVm1Gc2RXVmtTbTlvYm1aeVlXNWtiMjFZSUI4ZWo1dC10ai16cWpTR1FSWTRRejZocURKbkdpNG00T2k3eHY3MThRNnYyQmhZYWFSb1pHbG5aWE4wU1VRQ2NXVnNaVzFsYm5SSlpHVnVkR2xtYVdWeWFtSnBjblJvWDJSaGRHVnNaV3hsYldWdWRGWmhiSFZsYWpFNU9UQXRNVEF0TVRWbWNtRnVaRzl0V0NDQXVuY2tfRzZJbTA1ZnM1ODh3WTdidG9QNmlveHVmZnFmVS1fZHhIeXhNbXBwYzNOMVpYSkJkWFJvaEVPaEFTYWlCUGNZSVlGWkFrZ3dnZ0pFTUlJQjY2QURBZ0VDQWhRUkNEYzFic0JPc1RGbFZCMUZfczdMTmh1bmZUQUtCZ2dxaGtqT1BRUURBakJTTVFzd0NRWURWUVFHRXdKSFVqRVBNQTBHQTFVRUNBd0dSM0psWldObE1ROHdEUVlEVlFRSERBWkJkR2hsYm5NeERqQU1CZ05WQkFvTUJVZFZibVYwTVJFd0R3WURWUVFEREFoM2QxZGhiR3hsZERBZUZ3MHlOVEF5TWpZeE5URTJNek5hRncwek5UQXlNalF4TlRFMk16TmFNSFV4Q3pBSkJnTlZCQVlUQWtkU01ROHdEUVlEVlFRSURBWkhjbVZsWTJVeER6QU5CZ05WQkFjTUJrRjBhR1Z1Y3pFT01Bd0dBMVVFQ2d3RlIxVnVaWFF4RVRBUEJnTlZCQXNNQ0Vsa1pXNTBhWFI1TVNFd0h3WURWUVFEREJoWFlXeHNaWFFnUlc1MFpYSndjbWx6WlNCSmMzTjFaWEl3V1RBVEJnY3Foa2pPUFFJQkJnZ3Foa2pPUFFNQkJ3TkNBQVJKWDhqS0JHdFJYWXpnSFV3RDZRRVJwblkxaE5aUG1YQW1ackp3NG5nR3RzR0Z3dmpIbUNrd1ZQQmk0bVQ0M3VsNVdDZF9QQTFmb1BJNV83SjNuYWlkbzN3d2VqQUpCZ05WSFJNRUFqQUFNQTRHQTFVZER3RUJfd1FFQXdJRm9EQWRCZ05WSFNVRUZqQVVCZ2dyQmdFRkJRY0RBUVlJS3dZQkJRVUhBd0l3SFFZRFZSME9CQllFRk82dE9mX2I1ZFRvWnV5Ny1CT1YzaG00NEdHTk1COEdBMVVkSXdRWU1CYUFGSHg0LUc4OHI2T0xweDhyQnJmcVRXdEY3QVdpTUFvR0NDcUdTTTQ5QkFNQ0EwY0FNRVFDSUNvT0g5aTBwTTZTaGVFVjhSQV9VejcwczBIOGVyMXRlUHd5VFBTOXBjZ19BaUJxanE3WHJwZHkzUzVyOHlxN2NfS2dYN3FISlZCUVdoQlZ6QkM2VGJqX0lGa0NsZGdZV1FLUXVRQUdaM1psY25OcGIyNWpNUzR3YjJScFoyVnpkRUZzWjI5eWFYUm9iV2RUU0VFdE1qVTJiSFpoYkhWbFJHbG5aWE4wYzZGM1pYVXVaWFZ5YjNCaExtVmpMbVYxWkdrdWNHbGtMakdwQUZnZ25tcXFObnNTeFA4aEhScEZnODQ2WG83Zlp0bkkzc053cXJhZVlMN1JDTkVCV0NEZHQ2MnlGdlFRNzdfazA4bE1QaFptZFViT0g4czlJRWdUaGs3Vmk4NXc5UUpZSU1IelJSZGF1NmJ6aXFMYW9RY0RBR3R2MVBzSFhmNWNaOU11dEkwck93VE9BMWdna0FpdmxPdlZiZWIzMkFsN0x0UEFkQktqM2ctSU1VUTcyUl9iS0F0Zks1NEVXQ0NPdWxjMDBKWGN5dl9JSWNiRDBSWlpBY2c3d1c2S3RBdzdLcEJ2aEN4X3FnVllJSzlRWUhqMkpTYUVCOEIzT2pQOGRiYWc4V0RJeDFwS21zdk1QM01CVWRBSEJsZ2dPUWNJWXctMGxaYzVNNENqbkc4Qnh0Q3dBcFdwU21tSXRhdjhfOS1iRU1jSFdDQ0ZGUERvU0Z5SlRTRUN5MUdxd1V1MG1QZE5FVnVNdDgtNlJtWGlnUjFOb0FoWUlLb2pxTEVHenpybGgxa0tkSHFPY25NWGttTmFsYUFTeFNPa3didWgtbnBqYldSbGRtbGpaVXRsZVVsdVptLTVBQUZwWkdWMmFXTmxTMlY1cFNBQkJJRUtBUUloV0NEWUJYcFc5dHduZUhDYmZveE0tRUNvS0R0MTVCdW8xa3JkMkx0WmxHOGxteUpZSUhkdFlSelNtMy1yVzlhb3p6R1pWbVZYVGxuN2dQalk0RWI5VXFfOUNSeEhaMlJ2WTFSNWNHVjNaWFV1WlhWeWIzQmhMbVZqTG1WMVpHa3VjR2xrTGpGc2RtRnNhV1JwZEhsSmJtWnZ1UUFFWm5OcFoyNWxaTUIwTWpBeU5TMHdNaTB5TjFRd09UbzBPVG94TmxwcGRtRnNhV1JHY205dHdIUXlNREkxTFRBeUxUSTNWREE1T2pRNU9qRTJXbXAyWVd4cFpGVnVkR2xzd0hReU1ESTJMVEF5TFRJM1ZEQTVPalE1T2pFMldtNWxlSEJsWTNSbFpGVndaR0YwWmZkWVFFUmZFUGhYNzlmTmViMkFuMmE3NUkwU250UHg5TUZBcUdoRDBPVklUU25OcmVJdVhwejNJeXF0aHF4Q2YtVV9vZFozVEUxaWlXeTJsTWtvN042bXRCWnNaR1YyYVdObFUybG5ibVZrdVFBQ2FtNWhiV1ZUY0dGalpYUFlHRU81QUFCcVpHVjJhV05sUVhWMGFMa0FBbTlrWlhacFkyVlRhV2R1WVhSMWNtV0VRNkVCSnFFRTlfWllRR016bnF1VGZLMXh4LWU2bEJjNXE3ZTJXU0s5X0JhSkZBY19hbWpmYjh5RzhRMWx1dHJjdXVoZ09vQTJDbkNmY1pRY3pSVlhvanF1NmZVd0ZiRWNiLVpwWkdWMmFXTmxUV0ZqOTJaemRHRjBkWE1BIg`;

/**
 * This certificate was used to sign the issuer's certificate
 */
const rootCert = `-----BEGIN CERTIFICATE-----
MIICeTCCAiCgAwIBAgIUB5E9QVZtmUYcDtCjKB/H3VQv72gwCgYIKoZIzj0EAwIwgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMB4XDTI0MDUzMTA2NDgwOVoXDTM0MDUyOTA2NDgwOVowgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYGzdwFDnc7+Kn5ibAvCOM8ke77VQxqfMcwZL8IaIA+WCROcCfmY/giH92qMru5p/kyOivE0RC/IbdMONvDoUyaNmMGQwHQYDVR0OBBYEFNRWGMCJOOgOWIQYyXZiv6u7xZC+MB8GA1UdIwQYMBaAFNRWGMCJOOgOWIQYyXZiv6u7xZC+MBIGA1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMCA0cAMEQCIGEm7wkZKHt/atb4MdFnXW6yrnwMUT2u136gdtl10Y6hAiBuTFqvVYth1rbxzCP0xWZHmQK9kVyxn8GPfX27EIzzsw==
-----END CERTIFICATE-----`

const invalidRootCert = `-----BEGIN CERTIFICATE-----
MIICdDCCAhugAwIBAgIBAjAKBggqhkjOPQQDAjCBiDELMAkGA1UEBhMCREUxDzANBgNVBAcMBkJlcmxpbjEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxETAPBgNVBAsMCFQgQ1MgSURFMTYwNAYDVQQDDC1TUFJJTkQgRnVua2UgRVVESSBXYWxsZXQgUHJvdG90eXBlIElzc3VpbmcgQ0EwHhcNMjQwNTMxMDgxMzE3WhcNMjUwNzA1MDgxMzE3WjBsMQswCQYDVQQGEwJERTEdMBsGA1UECgwUQnVuZGVzZHJ1Y2tlcmVpIEdtYkgxCjAIBgNVBAsMAUkxMjAwBgNVBAMMKVNQUklORCBGdW5rZSBFVURJIFdhbGxldCBQcm90b3R5cGUgSXNzdWVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEOFBq4YMKg4w5fTifsytwBuJf/7E7VhRPXiNm52S3q1ETIgBdXyDK3kVxGxgeHPivLP3uuMvS6iDEc7qMxmvduKOBkDCBjTAdBgNVHQ4EFgQUiPhCkLErDXPLW2/J0WVeghyw+mIwDAYDVR0TAQH/BAIwADAOBgNVHQ8BAf8EBAMCB4AwLQYDVR0RBCYwJIIiZGVtby5waWQtaXNzdWVyLmJ1bmRlc2RydWNrZXJlaS5kZTAfBgNVHSMEGDAWgBTUVhjAiTjoDliEGMl2Yr+ru8WQvjAKBggqhkjOPQQDAgNHADBEAiAbf5TzkcQzhfWoIoyi1VN7d8I9BsFKm1MWluRph2byGQIgKYkdrNf2xXPjVSbjW/U/5S5vAEC5XxcOanusOBroBbU=
-----END CERTIFICATE-----`

const context: Context = {
	clockTolerance: 0,
	lang: 'en-US',
	subtle: crypto.subtle,
	trustedCertificates: [rootCert],
};

describe("The MsoMdocVerifier", () => {

	const resolverEngine = PublicKeyResolverEngine();

	const verifier = MsoMdocVerifier({ context, pkResolverEngine: resolverEngine });

	it("should produce successful result when verifying IssuerSigned", async () => {
		const result = await verifier.verify({ rawCredential: issuerSignedB64U, opts: {} });
		assert(result.success);
	});

	it("should produce successful result when verifying DeviceResponse", async () => {
		const result = await verifier.verify({
			rawCredential: deviceResponseB64U, opts: {
				responseUri: "http://wallet-enterprise-acme-verifier:8005/verification/direct_post",
				expectedAudience: "wallet-enterprise-acme-verifier",
				holderNonce: "da1c17aa7d902ef8",
				expectedNonce: "6bc90bea-1e01-49a3-a4de-5d98ddb64850"
			}
		});
		assert(result.success);
	});

	it("should produce error because the wrong root certificate was used", async () => {
		// load the invalid root certificate
		const verifier = MsoMdocVerifier({
			context: {
				...context,
				trustedCertificates: [invalidRootCert],
			}, pkResolverEngine: resolverEngine
		});

		const result = await verifier.verify({ rawCredential: deviceResponseB64U, opts: {} });
		assert(result.success === false);
		assert(result.error === CredentialVerificationError.NotTrustedIssuer);
	});


	it("should produce error because the wrong root certificate was used", async () => {
		// load the invalid root certificate
		const verifier = MsoMdocVerifier({
			context: {
				...context,
				trustedCertificates: [],
			}, pkResolverEngine: resolverEngine
		});

		const result = await verifier.verify({ rawCredential: deviceResponseB64UWalletIssuer, opts: {} });
		console.log(result);
	});
})
