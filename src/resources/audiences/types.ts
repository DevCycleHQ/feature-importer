import { AudienceResponse } from '../../types/DevCycle'

export type AudienceOutput = {
    audiencesByKey: Record<string, AudienceResponse>
    errorsByKey: Record<string, string>
}