jest.mock("../../api");

import { LDAudienceImporter } from ".";
import { LD, DVC } from "../../api";
import { Operator, OperatorType } from "../../types/DevCycle";

const mockLD = LD as jest.Mocked<typeof LD>;
const mockDVC = DVC as jest.Mocked<typeof DVC>;

const mockConfig = {
  ldAccessToken: "123",
  dvcClientId: "dvcid",
  dvcClientSecret: "dvcsecret",
  sourceProjectKey: "project-key",
  targetProjectKey: "target-project-key",
};

const mockDvcAudienceResponse = {
  _id: "id_123",
  _project: "project_123",
  name: "audience name",
  key: "audience-key",
  description: "audience description",
  filters: {
    filters: [],
    operator: "and" as Operator["operator"],
  },
};

const validSegment = {
  name: "segment 1",
  key: "seg-1",
  description: "my segment",
  tags: ["tag1", "tag2"],
  creationDate: 123456789,
  rules: [],
};

describe("LDAudienceImporter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("audience is created when it doesn't exist yet", async () => {
    const config = { ...mockConfig };
    const envKey = "production";
    const ldSegment = { ...validSegment };
    const expectedFilters = {
      operator: OperatorType.or,
      filters: [],
    };
    const createResponse = {
      ...mockDvcAudienceResponse,
      name: ldSegment.name,
      key: config.targetProjectKey,
      filters: expectedFilters,
    };
    mockLD.getAllSegments.mockResolvedValue({ items: [ldSegment] });
    mockDVC.getAudiences.mockResolvedValue([]);
    mockDVC.createAudience.mockResolvedValue(createResponse);

    const audienceImporter = new LDAudienceImporter(config);
    await audienceImporter.import([envKey]);

    expect(audienceImporter.audiences).toEqual({
      [`${ldSegment.key}-${envKey}`]: createResponse,
    });
    expect(audienceImporter.errors).toEqual({});
    expect(mockDVC.createAudience).toHaveBeenCalledWith(
      config.targetProjectKey,
      {
        name: ldSegment.name,
        key: `${ldSegment.key}-${envKey}`,
        description: ldSegment.description,
        tags: ldSegment.tags,
        filters: expectedFilters,
      }
    );
    expect(mockDVC.updateAudience).not.toHaveBeenCalled();
  });

  test("audience is skipped if it already exists", async () => {
    const config = { ...mockConfig };
    const envKey = "production";
    const ldSegment = { ...validSegment };
    const existingAudience = {
      ...mockDvcAudienceResponse,
      key: `${ldSegment.key}-${envKey}`,
    };
    mockLD.getAllSegments.mockResolvedValue({ items: [ldSegment] });
    mockDVC.getAudiences.mockResolvedValue([existingAudience]);

    const audienceImporter = new LDAudienceImporter(config);
    await audienceImporter.import([envKey]);

    expect(audienceImporter.audiences).toEqual({
      [existingAudience.key]: existingAudience,
    });
    expect(audienceImporter.errors).toEqual({});
    expect(mockDVC.createAudience).not.toHaveBeenCalled();
    expect(mockDVC.updateAudience).not.toHaveBeenCalled();
  });

  test("audience is updated if overwriteDuplicates is true", async () => {
    const config = { ...mockConfig, overwriteDuplicates: true };
    const envKey = "production";
    const ldSegment = { ...validSegment };
    const existingAudience = {
      ...mockDvcAudienceResponse,
      key: `${ldSegment.key}-${envKey}`,
    };
    const expectedFilters = {
      operator: OperatorType.or,
      filters: [],
    };
    const updateResponse = {
      ...mockDvcAudienceResponse,
      name: ldSegment.name,
      key: config.targetProjectKey,
      filters: expectedFilters,
    };
    mockLD.getAllSegments.mockResolvedValue({ items: [ldSegment] });
    mockDVC.getAudiences.mockResolvedValue([existingAudience]);
    mockDVC.updateAudience.mockResolvedValue(updateResponse);

    const audienceImporter = new LDAudienceImporter(config);
    await audienceImporter.import([envKey]);

    expect(audienceImporter.audiences).toEqual({
      [`${ldSegment.key}-${envKey}`]: updateResponse,
    });
    expect(audienceImporter.errors).toEqual({});
    expect(mockDVC.updateAudience).toHaveBeenCalledWith(
      config.targetProjectKey,
      `${ldSegment.key}-${envKey}`,
      {
        name: ldSegment.name,
        key: `${ldSegment.key}-${envKey}`,
        description: ldSegment.description,
        tags: ldSegment.tags,
        filters: expectedFilters,
      }
    );
    expect(mockDVC.createAudience).not.toHaveBeenCalled();
  });
});
