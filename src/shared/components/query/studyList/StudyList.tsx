import * as React from 'react';
import {TypeOfCancer as CancerType, CancerStudy} from "../../../api/generated/CBioPortalAPI";
import * as styles_any from './styles.module.scss';
import classNames from 'classnames';
import FontAwesome from "react-fontawesome";
import LabeledCheckbox from "../../labeledCheckbox/LabeledCheckbox";
import {observer} from "mobx-react";
import {getStudySummaryUrl, getPubMedUrl} from "../../../api/urls";
import {QueryStoreComponent} from "../QueryStore";
import DefaultTooltip from "../../DefaultTooltip";
import StudyListLogic from "../StudyListLogic";
import {cached} from 'mobxpromise';

const styles = {
	...styles_any as {
		StudyList: string,
		SelectedStudyList: string,

		CancerType: string,
		CancerTypeName: string,
		SelectAll: string,

		Study: string,
		StudyName: string,
		StudyMeta: string,
		StudySamples: string,
		StudyLinks: string,

		icon: string,
		iconWithTooltip: string,
		tooltip: string,

		disabled: string,
		enabled: string,
		indentArrow: string,

		closeSelected: string,
		deselectAll: string,
		highlighted: string,
	},
	Level: (level:number) => styles_any[`Level${level}`]
};

export interface IStudyListProps
{
	showSelectedStudiesOnly?: boolean;
}

@observer
export default class StudyList extends QueryStoreComponent<IStudyListProps, void>
{
	get logic() { return this.store.studyListLogic; }

	get rootCancerType() { return this.store.treeData.rootCancerType; }

	get view()
	{
		return this.props.showSelectedStudiesOnly
			? this.logic.selectedStudiesView
			: this.logic.mainView;
	}

	render()
	{
		if (this.props.showSelectedStudiesOnly)
			return this.renderSelectedStudies();
		else
			return this.renderCancerType(this.rootCancerType);
	}

	renderSelectedStudies = () =>
	{
		return (
			<div className={styles.SelectedStudyList}>
				<h4>
						Selected Studies 
						<span 
							className={styles.closeSelected}
							onClick={() => this.store.showSelectedStudiesOnly = !this.store.showSelectedStudiesOnly}
						>
							Return to Study Selector
						</span>
				</h4>
				<span className={styles.deselectAll} onClick={() => this.view.hack_handleSelectAll(false)}>
					Deselect all
				</span>
				<ul className={styles.StudyList}>
					{this.renderCancerType(this.rootCancerType)}
				</ul>
			</div>
		);
	}

	renderCancerType = (cancerType:CancerType, arrayIndex:number = 0):JSX.Element | null =>
	{
		// BEGIN TEMP HACK
		let descendantStudies = this.view.getDescendantCancerStudies(cancerType);
		if (!descendantStudies.length)
			return null;
		// END TEMP HACK

		let currentLevel = this.logic.getDepth(cancerType);
		let childCancerTypes = this.view.getChildCancerTypes(cancerType);
		let childStudies = this.view.getChildCancerStudies(cancerType);

		let heading:JSX.Element | undefined;
		let indentArrow:JSX.Element | undefined;

		if (cancerType != this.rootCancerType)
		{
			let liClassName = classNames(
				styles.CancerType,
				styles.Level(currentLevel),
				this.logic.isHighlighted(cancerType) && styles.highlighted,
			);

			if (currentLevel === 3)
				indentArrow = (
					<FontAwesome className={styles.indentArrow} name="long-arrow-right" />
				);

			heading = (
				<li className={liClassName}>
					<LabeledCheckbox
						{...this.view.getCheckboxProps(cancerType)}
						onChange={event => this.view.onCheck(cancerType, (event.target as HTMLInputElement).checked)}
					>
						{indentArrow} 
						<span className={styles.CancerTypeName}>
							{cancerType.name}
						</span>
						{!!(!this.store.forDownloadTab) && (
							<span className={styles.SelectAll}>
								Select All
							</span>
						)}
					</LabeledCheckbox>
				</li>
			);
		}

		let ulClassName = classNames(
			styles.StudyList,
			styles.Level(currentLevel),
		);
		return (
			<ul key={arrayIndex} className={ulClassName}>
				{heading}
				{childStudies.map(this.renderCancerStudy)}
				{childCancerTypes.map(this.renderCancerType)}
			</ul>
		);
	}

	renderCancerStudy = (study:CancerStudy, arrayIndex:number) =>
	{
		let liClassName = classNames(
			styles.Study,
			this.logic.isHighlighted(study) && styles.highlighted,
		);
		return (
			<li key={arrayIndex} className={liClassName}>
				{this.renderStudyName(study)}
				<div className={styles.StudyMeta}>
					{this.renderSamples(study)}
					{this.renderStudyLinks(study)}
				</div>
			</li>
		);
	}

	renderStudyName = (study:CancerStudy) =>
	{
		return (
			<LabeledCheckbox
				{...this.view.getCheckboxProps(study)}
				onChange={event => this.view.onCheck(study, (event.target as HTMLInputElement).checked)}
			>
				<span className={styles.StudyName}>
					{study.name}
				</span>
			</LabeledCheckbox>
		);
	}

	renderSamples = (study:CancerStudy) =>
	{
		return (
			<span className={styles.StudySamples}>
				{`${study.allSampleCount} samples`}
			</span>
		);
	}

	renderStudyLinks = (study:CancerStudy) =>
	{
		let links = [
			{
				icon: 'info-circle',
				url: undefined,
				tooltip: study.description
			},
			{
				icon: 'bar-chart',
				url: study.studyId && getStudySummaryUrl(study.studyId),
				tooltip: study.studyId && "Summary"
			},
			{
				icon: 'book',
				url: study.pmid && getPubMedUrl(study.pmid),
				tooltip: study.pmid && "PubMed"
			},
		];
		return (
			<span className={styles.StudyLinks}>
				{links.map((link, i) => {
					let content = (
						<FontAwesome
							key={i}
							name={link.icon}
							className={classNames({
								[styles.icon]: true,
								[styles.iconWithTooltip]: !!link.tooltip,
							})}
						/>
					);

					if (link.url)
						content = (
							<a key={i} href={link.url}>
								{content}
							</a>
						);

					if (link.tooltip)
					{
						let overlay = (
							<div className={styles.tooltip} dangerouslySetInnerHTML={{__html: link.tooltip}}/>
						);
						content = (
							<DefaultTooltip
								key={i}
								mouseEnterDelay={0}
								placement="top"
								overlay={overlay}
								children={content}
							/>
						);
					}

					return content;
				})}
			</span>
		);
	}
}
