import React from 'react';
import {Row, Col, Button} from 'antd';
import {Link} from 'react-router';
import ConceptsList from './ConceptsList';
import ConceptArchiveButton from './ConceptArchiveButton';
import {Concept} from '../containers/ConceptsIndex';
import ArchivedTag from './ArchivedTag';
import ReplacedWithLink from './ReplacedWithLink';
export interface ConceptShowProps {
  concept: Concept
}

const ConceptShow: React.SFC<ConceptShowProps> = ({concept}) => {
  return (
    <div>
      <h3>{concept.name} <ArchivedTag concept={concept}/><ReplacedWithLink concept={concept}/></h3>
      <p dangerouslySetInnerHTML={{ __html: concept.description}} />
      <p>UID: {concept.uid}</p>
      <Button.Group>
        <Link to={`${concept.id}/edit`}>
          <Button type="default" icon="edit">Edit</Button>
        </Link>
        <ConceptArchiveButton id={concept.id} visible={concept.visible}/>
        <Link to={`${concept.id}/replace`}>
          <Button type="default" icon="fork">Find & Replace</Button>
        </Link>
      </Button.Group>
      <Row gutter={16}>
        <Col span={12}><ConceptsList concepts={concept.siblings} title={"Siblings"}/></Col>
        <Col span={12}><ConceptsList concepts={concept.children} title={"Children"}/></Col>
      </Row>
    </div>
  )

}

export default ConceptShow
