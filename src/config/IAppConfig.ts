export interface IAppConfig {
    host: string;
    genomespaceEnabled: boolean;
    cancerStudySearchPresets: string[];
    priorityStudies: PriorityStudies;
}

export type PriorityStudies = {
    [category:string]: string[]
};
