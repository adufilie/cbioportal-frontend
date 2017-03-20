import * as React from 'react';
import * as styles_any from './styles.module.scss';
import {Modal} from 'react-bootstrap';
import ReactSelect from 'react-select';
import {observer} from "mobx-react";
import {computed} from 'mobx';
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import gene_lists from './gene_lists';
import GeneSymbolValidator from "./GeneSymbolValidator";
import classNames from "../../lib/classNames";
import AsyncStatus from "../asyncStatus/AsyncStatus";
import {getOncoQueryDocUrl} from "../../api/urls";
import {QueryStoreComponent} from "./QueryStore";
import MutSigGeneSelector from "./MutSigGeneSelector";
import GisticGeneSelector from "./GisticGeneSelector";

const styles = styles_any as {
	GeneSetSelector: string,
	MutSigGeneSelectorWindow: string,
	GisticGeneSelectorWindow: string,
	ReactSelect: string,
	buttonRow: string,
	geneSet: string,
	empty: string,
	notEmpty: string,
};

export interface GeneSetSelectorProps
{
}

@observer
export default class GeneSetSelector extends QueryStoreComponent<GeneSetSelectorProps, {}>
{
	@computed get selectedGeneListOption()
	{
		let option = this.geneListOptions.find(opt => opt.value == this.store.geneQuery);
		return option ? option.value : '';
	}

	@computed get geneListOptions()
	{
		return [
			{
				label: 'User-defined List',
				value: ''
			},
			...gene_lists.map(item => ({
				label: `${item.id} (${item.genes.length} genes)`,
				value: item.genes.join(' ')
			}))
		];
	}

	@computed get textAreaRef()
	{
		if (this.store.geneQueryErrorDisplayStatus === 'shouldFocus')
			return (textArea:HTMLTextAreaElement) => {
				let {error} = this.store.oql;
				if (textArea && error)
				{
					textArea.focus();
					textArea.setSelectionRange(error.start, error.end);
					this.store.geneQueryErrorDisplayStatus = 'focused';
				}
			};
	}

	render()
	{
		return (
			<FlexCol padded overflow className={styles.GeneSetSelector}>
				<h2>Enter Gene Set:</h2>
				<a href={getOncoQueryDocUrl()}>Advanced: Onco Query Language (OQL)</a>
				<ReactSelect
					className={styles.ReactSelect}
					value={this.selectedGeneListOption}
					options={this.geneListOptions}
					onChange={option => this.store.geneQuery = option ? option.value : ''}
				/>

				<FlexRow padded className={styles.buttonRow}>
					<AsyncStatus promise={this.store.mutSigForSingleStudy}>
						{!!(this.store.mutSigForSingleStudy.result.length) && (
							<button onClick={() => this.store.showMutSigPopup = true}>
								Select from Recurrently Mutated Genes (MutSig)
							</button>
						)}
					</AsyncStatus>
					<AsyncStatus promise={this.store.gisticForSingleStudy}>
						{!!(this.store.gisticForSingleStudy.result.length) && (
							<button onClick={() => this.store.showGisticPopup = true}>
								Select Genes from Recurrent CNAs (Gistic)
							</button>
						)}
					</AsyncStatus>
				</FlexRow>

				<textarea
					ref={this.textAreaRef}
					className={classNames(styles.geneSet, this.store.geneQuery ? styles.notEmpty : styles.empty)}
					rows={5}
					cols={80}
					placeholder="Enter HUGO Gene Symbols or Gene Aliases"
					title="Enter HUGO Gene Symbols or Gene Aliases"
					value={this.store.geneQuery}
					onChange={event => this.store.geneQuery = event.currentTarget.value}
				/>

				<GeneSymbolValidator/>

				<Modal
					className={styles.MutSigGeneSelectorWindow}
					show={this.store.showMutSigPopup}
					onHide={() => this.store.showMutSigPopup = false}
				>
					<Modal.Header closeButton>
						<Modal.Title>Recently Mutated Genes</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<MutSigGeneSelector
							initialSelection={this.store.geneIds}
							data={this.store.mutSigForSingleStudy.result}
							onSelect={map_geneSymbol_selected => {
								this.store.applyGeneSelection(map_geneSymbol_selected);
								this.store.showMutSigPopup = false;
							}}
						/>
					</Modal.Body>
				</Modal>

				<Modal
					className={styles.GisticGeneSelectorWindow}
					show={this.store.showGisticPopup}
					onHide={() => this.store.showGisticPopup = false}
				>
					<Modal.Header closeButton>
						<Modal.Title>Recurrent Copy Number Alterations (Gistic)</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<GisticGeneSelector
							initialSelection={this.store.geneIds}
							data={this.store.gisticForSingleStudy.result}
							onSelect={map_geneSymbol_selected => {
								this.store.applyGeneSelection(map_geneSymbol_selected);
								this.store.showGisticPopup = false;
							}}
						/>
					</Modal.Body>
				</Modal>
			</FlexCol>
		);
	}
}
