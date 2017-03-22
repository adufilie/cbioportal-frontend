import * as React from 'react';
import queryStore from "./QueryStore";
import {Tabs, Tab, default as ReactBootstrap} from 'react-bootstrap';
import * as styles_any from './styles.module.scss';
import {observer} from 'mobx-react';
import QueryContainer from "./QueryContainer";

const styles = styles_any as {
	QueryAndDownloadTabs: string,
};

interface IQueryAndDownloadTabsProps
{
}

@observer
export default class QueryAndDownloadTabs extends React.Component<IQueryAndDownloadTabsProps, {}>
{
	get store()
	{
		return queryStore;
	}

	onSelectTab = (eventKey:string) =>
	{
		this.store.forDownloadTab = eventKey === 'download';
	}

	render()
	{
		return (
			<div className={styles.QueryAndDownloadTabs}>
				<Tabs
					id='QueryAndDownloadTabs'
					animation={false}
					activeKey={this.store.forDownloadTab ? 'download' : 'query'}
					onSelect={this.onSelectTab as ReactBootstrap.SelectCallback}
				>
					<Tab eventKey='query' title="Query"/>
					<Tab eventKey='download' title="Download Data"/>
				</Tabs>
				<QueryContainer/>
			</div>
		);
	}
}
