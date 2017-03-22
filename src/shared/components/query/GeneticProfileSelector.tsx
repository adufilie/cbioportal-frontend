import * as _ from 'lodash';
import * as React from 'react';
import {GeneticProfile} from "../../api/generated/CBioPortalAPI";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import FontAwesome from "react-fontawesome";
import * as styles_any from './styles.module.scss';
import queryStore from "./QueryStore";
import {action} from 'mobx';
import {observer} from "mobx-react";
import AsyncStatus from "../asyncStatus/AsyncStatus";
import classNames from "../../lib/classNames";
import {FlexCol} from "../flexbox/FlexBox";

const styles = styles_any as {
	GeneticProfileSelector: string,
	group: string,
	altType: string,
	radio: string,
	checkbox: string,
	infoIcon: string,
	zScore: string,
	groupName: string,
	profileName: string,
};

@observer
export default class GeneticProfileSelector extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
	}

	render()
	{
		if (!this.store.singleSelectedStudyId)
			return null;

		return (
			<FlexCol padded className={styles.GeneticProfileSelector}>
				<h2>Select Genomic Profiles:</h2>
				<AsyncStatus className={styles.group} promise={this.store.geneticProfiles}>
					{this.renderGroup("MUTATION_EXTENDED", "Mutation")}
					{this.renderGroup("COPY_NUMBER_ALTERATION", "Copy Number")}
					{this.renderGroup("MRNA_EXPRESSION", "mRNA Expression")}
					{this.renderGroup("METHYLATION", "DNA Methylation")}
					{this.renderGroup("METHYLATION_BINARY", "DNA Methylation")}
					{this.renderGroup("PROTEIN_LEVEL", "Protein/phosphoprotein level")}
					{!!(!this.store.geneticProfiles.result.length) && (
						<strong>No Genomic Profiles available for this Cancer Study</strong>
					)}
				</AsyncStatus>
			</FlexCol>
		);
	}

	ProfileToggle = ({profile, type, label, checked, isGroupToggle}: {
		profile:GeneticProfile,
		type:'radio' | 'checkbox',
		label:string,
		checked:boolean,
		isGroupToggle:boolean
	}) => (
		<label
			className={classNames({
				[styles.altType]: isGroupToggle,
				[styles.radio]: type === 'radio',
				[styles.checkbox]: type === 'checkbox',
			})}
		>
			<input
				type={type}
				checked={checked}
				onChange={event => this.store.selectGeneticProfile(profile, (event.target as HTMLInputElement).checked)}
			/>
			<span className={isGroupToggle ? styles.groupName : styles.profileName}>
				{label}
			</span>
			{!isGroupToggle && (
				<FontAwesome className={styles.infoIcon} name='question-circle' {...{title: profile.description}}/>
			)}
		</label>
	);

	renderGroup(geneticAlterationType:GeneticProfile['geneticAlterationType'], groupLabel:string)
	{
		let profiles = this.store.getFilteredProfiles(geneticAlterationType);
		if (!profiles.length)
			return null;

		let groupProfileIds = profiles.map(profile => profile.geneticProfileId);
		let groupIsSelected = _.intersection(this.store.selectedProfileIds, groupProfileIds).length > 0;
		let output:JSX.Element[] = [];

		if (profiles.length > 1 && !this.store.forDownloadTab)
			output.push(
				<this.ProfileToggle
					key={'altTypeCheckbox:' + geneticAlterationType}
					profile={profiles[0]}
					type='checkbox'
					label={`${groupLabel}. Select one of the profiles below:`}
					checked={groupIsSelected}
					isGroupToggle={true}
				/>
			);

		let profileToggles = profiles.map(profile => (
			<this.ProfileToggle
				key={'profile:' + profile.geneticProfileId}
				profile={profile}
				type={this.store.forDownloadTab || profiles.length > 1 ? 'radio' : 'checkbox'}
				label={profile.name}
				checked={_.includes(this.store.selectedProfileIds, profile.geneticProfileId)}
				isGroupToggle={false}
			/>
		));

		if (this.store.forDownloadTab || profiles.length == 1)
			output.push(...profileToggles);
		else
			output.push(
				<div key={'group:' + geneticAlterationType} className={styles.group}>
					{profileToggles}
				</div>
			);

		if (this.store.forDownloadTab)
			return output;

		if (groupIsSelected && geneticAlterationType == 'MRNA_EXPRESSION')
		{
			output.push(
				<div key={output.length} className={styles.zScore}>
					Enter a z-score threshold ±:
					<input
						type="text"
						value={this.store.zScoreThreshold}
						onChange={event => {
							this.store.zScoreThreshold = (event.target as HTMLInputElement).value;
						}}
					/>
				</div>
			);
		}

		if (groupIsSelected && geneticAlterationType == 'PROTEIN_LEVEL')
		{
			output.push(
				<div key={output.length} className={styles.zScore}>
					Enter a z-score threshold ±:
					<input
						type="text"
						value={this.store.rppaScoreThreshold}
						onChange={event => {
							this.store.rppaScoreThreshold = (event.target as HTMLInputElement).value;
						}}
					/>
				</div>
			);
		}

		return output;
	}
}
