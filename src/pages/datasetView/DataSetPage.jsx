import * as React from "react";
import { actionCreators, mapStateToProps } from './duck';
import { connect } from 'react-redux';
import { Table }  from 'reactable';
import * as _ from 'underscore';
export class DataSetPageUnconnected extends React.Component {

    componentDidMount(){

        this.props.loadDatasetsInfo();

    }


    render() {
        if (this.props.datasets) {
            const rows = [];
            const studies = [];
            var tempObj = {};
            this.props.datasets.forEach((item) => {
                if(studies.indexOf(item.cancer_study_identifier) === -1){
                    studies.push(item.cancer_study_identifier);
                    tempObj = {
                        CancerStudy: <div>
                            <a key='name' href={`http://www.cbioportal.org/study?id=${item.cancer_study_identifier}#summary`} target='_blank'>
                                {item.name}
                            </a>
                            {' '}
                            <a key='icon' href={`https://github.com/cBioPortal/datahub/blob/master/public/${item.cancer_study_identifier}.tar.gz`} download>
                                <i className='fa fa-download'/>
                            </a>
                        </div>
                    };
                    if(!_.isNull(item.citation)){
                        tempObj.Reference = (
                            <a target='_blank' href={`https://www.ncbi.nlm.nih.gov/pubmed/${item.pmid}`}>
                                {item.citation}
                            </a>
                        );
                    }
                    rows.push(tempObj);
                }
                tempObj = rows[studies.indexOf(item.cancer_study_identifier)];
                if(item.stable_id.endsWith("_all")){
                    tempObj.All = item.count;
                }else if(item.stable_id.endsWith("_sequenced")){
                    tempObj.Sequenced = item.count;
                }else if(item.stable_id.endsWith("_cna")){
                    tempObj.CNA = item.count;
                }else if(item.stable_id.endsWith("rna_seq_v2_mrna")){
                    tempObj["Tumor mRNA (RNA-Seq V2)"] = item.count;
                }else if(item.stable_id.endsWith("_microrna")){
                    tempObj["Tumor mRNA (microarray)"] = item.count;
                }else if(item.stable_id.endsWith("mrna")){
                    tempObj["Tumor miRNA"] = item.count;
                }else if(item.stable_id.endsWith("methylation_hm27")){
                    tempObj["Methylation (HM27)"] = item.count;
                }else if(item.stable_id.endsWith("_rppa")){
                    tempObj.RPPA = item.count;
                }else if(item.stable_id.endsWith("_complete")){
                    tempObj.Complete = item.count;
                }
            });

        //    return <Table className="table" data={rows} sortable={true} filterable={['Name', 'Reference', 'All', 'Sequenced', 'CNA', 'Tumor_RNA_seq', 'Tumor_RNA_microarray', 'Tumor_miRNA', 'Methylation', 'RPPA', 'Complete']}/>;
            return <Table className="table" data={rows} sortable={true} filterable={['CancerStudy','Reference','All','Sequenced','CNA','Tumor mRNA (RNA-Seq V2)','Tumor mRNA (microarray)','Tumor miRNA','Methylation (HM27)','RPPA','Complete']}/>;
        } else {
            return <div>loading</div>
        }
    }
};

export default connect(mapStateToProps,actionCreators)(DataSetPageUnconnected);





